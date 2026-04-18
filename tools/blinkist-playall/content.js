// Content script injected into every blinkist.com page.
// Two modes based on URL:
//   - Library mode: scrapes saved items, injects "Play all" button.
//   - Player mode: when an active queue exists, auto-plays, auto-advances
//     through chapters, then signals background to go to the next book.

const DEBUG = true;
const log = (...args) => DEBUG && console.log('[BPA]', ...args);

const LIBRARY_PATHS = [
  '/en/app/library',
  '/en/app/library/saved',
];

function isLibraryPage() {
  return LIBRARY_PATHS.some((p) => location.pathname.startsWith(p));
}

function isPlayerPage() {
  // Real player is /en/reader/books/<slug>. The /en/app/books/<slug> route is
  // just a landing page with Read/Play CTAs — not where audio lives.
  return /^\/en\/reader\/books\//.test(location.pathname);
}

function readerUrlForSlug(slug) {
  return `https://www.blinkist.com/en/reader/books/${slug}?play=1`;
}

// ---------- LIBRARY MODE ----------

// Best-effort selector discovery. Blinkist ships a React SPA with hashed
// class names, so we try multiple strategies and log what we find.
function isSavedFullPage() {
  return location.pathname.startsWith('/en/app/library/saved');
}

function findSavedSection() {
  // On the dedicated /library/saved page, the whole page IS the saved list.
  if (isSavedFullPage()) return document.body;
  // On /library home, find the "Saved" carousel section by heading.
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
  for (const h of headings) {
    if (/^\s*Saved\s*$/i.test(h.textContent || '')) {
      let el = h;
      for (let i = 0; i < 6 && el; i++) {
        if (el.querySelector('a[href*="/books/"]')) return el;
        el = el.parentElement;
      }
    }
  }
  return null;
}

function scrapeSavedItems(root) {
  const scope = root || document;
  // Each tile is typically an <a href="/en/app/books/<slug>"> wrapping cover + title.
  const links = Array.from(scope.querySelectorAll('a[href*="/books/"]'));
  const seen = new Set();
  const items = [];
  for (const a of links) {
    const href = a.getAttribute('href');
    if (!href) continue;
    const match = href.match(/\/books\/([^/?#]+)/);
    if (!match) continue;
    const slug = match[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const title =
      a.querySelector('[class*="title" i]')?.textContent?.trim() ||
      a.getAttribute('aria-label')?.trim() ||
      a.textContent?.trim().split('\n')[0] ||
      slug;
    // Heuristic for "finished": tile has a checkmark/finished badge.
    const finished = !!a.querySelector(
      '[class*="finished" i], [class*="completed" i], [data-finished="true"]'
    );
    items.push({
      title,
      slug,
      url: readerUrlForSlug(slug),
      finished,
    });
  }
  return items;
}

// Fetch the full /library/saved page and scrape it. Home page only shows a
// carousel of ~8 items; the full list lives at /en/app/library/saved.
async function fetchFullSavedList() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://www.blinkist.com/en/app/library/saved', {
      credentials: 'include',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      log('fetchFullSavedList: HTTP', res.status);
      return null;
    }
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items = scrapeSavedItems(doc);
    log(`fetchFullSavedList: parsed ${items.length} items from SPA shell`);
    return items;
  } catch (err) {
    log('fetchFullSavedList error', err);
    return null;
  }
}

// Fallback: scroll the Saved carousel to force lazy-loaded tiles to render,
// then scrape whatever is now in the DOM.
async function scrollSavedCarouselAndScrape() {
  const section = findSavedSection();
  if (!section) return [];
  const rightBtn = section.querySelector(
    'button[aria-label*="slide right" i], button[aria-label*="next" i]'
  );
  if (rightBtn) {
    for (let i = 0; i < 15 && !rightBtn.disabled; i++) {
      rightBtn.click();
      await new Promise((r) => setTimeout(r, 220));
    }
  }
  return scrapeSavedItems(findSavedSection() || document);
}

async function runScrapeAndStart(btn) {
  btn.disabled = true;
  btn.textContent = 'Scanning saved…';
  // Give the SPA a beat to render tiles if we just navigated in.
  let items = scrapeSavedItems(document);
  if (items.length < 10) {
    for (let i = 0; i < 10 && items.length < 10; i++) {
      await new Promise((r) => setTimeout(r, 400));
      items = scrapeSavedItems(document);
    }
  }
  // Scroll to bottom to force lazy-load of any remaining tiles.
  let prevCount = -1;
  for (let i = 0; i < 10 && items.length !== prevCount; i++) {
    prevCount = items.length;
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    items = scrapeSavedItems(document);
  }
  log(`final scrape: ${items.length} items`, items);
  btn.disabled = false;
  btn.textContent = '▶ Play all saved';
  const playable = items.filter((i) => !i.finished);
  playable.reverse();
  if (playable.length === 0) {
    alert('Blinkist Play All: no saved items found. Open DevTools for logs.');
    return;
  }
  const confirmed = confirm(
    `Start playback of ${playable.length} saved blinks (oldest first)?`
  );
  if (!confirmed) return;
  chrome.runtime.sendMessage(
    { type: 'BPA_START', items: playable },
    (resp) => log('start response', resp)
  );
}

function injectPlayAllButton(scrapeFn) {
  if (document.getElementById('bpa-play-all')) return;
  const btn = document.createElement('button');
  btn.id = 'bpa-play-all';
  btn.textContent = '▶ Play all saved';
  Object.assign(btn.style, {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: '999999',
    padding: '14px 20px',
    background: '#0365F2',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    cursor: 'pointer',
  });
  btn.addEventListener('click', async () => {
    if (!isSavedFullPage()) {
      // Full list only renders on /library/saved. Set a flag so we auto-resume
      // the scrape + confirm flow after the navigation lands.
      await chrome.storage.local.set({ bpaAutoStart: true });
      location.href = 'https://www.blinkist.com/en/app/library/saved';
      return;
    }
    await runScrapeAndStart(btn);
  });
  document.body.appendChild(btn);
}

async function runLibraryMode() {
  const tryInject = () => {
    const section = findSavedSection();
    if (!section) {
      log('Saved section not found yet; retrying...');
      return false;
    }
    log('Saved section found', section);
    const items = scrapeSavedItems(section);
    log(`initial scrape: ${items.length} items`, items);
    injectPlayAllButton(() => scrapeSavedItems(findSavedSection() || document));
    return true;
  };
  if (!tryInject()) {
    const obs = new MutationObserver(() => {
      if (tryInject()) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 15000);
  }
  // If we navigated here from the home carousel via the Play All button,
  // auto-resume the scrape + confirm flow.
  if (isSavedFullPage()) {
    const { bpaAutoStart } = await chrome.storage.local.get('bpaAutoStart');
    if (bpaAutoStart) {
      await chrome.storage.local.remove('bpaAutoStart');
      // Wait for the button to exist.
      for (let i = 0; i < 20; i++) {
        const btn = document.getElementById('bpa-play-all');
        if (btn) {
          runScrapeAndStart(btn);
          break;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }
}

// ---------- PLAYER MODE ----------

async function getState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'BPA_GET_STATE' }, (resp) => {
      resolve(resp?.state || null);
    });
  });
}

function findAudio() {
  return document.querySelector('audio');
}

function clickPlayIfPaused() {
  const audio = findAudio();
  if (audio && audio.paused) {
    audio.play().catch((err) => log('audio.play() rejected', err));
    return true;
  }
  // Fallback: click a play button by aria-label
  const btn = document.querySelector(
    'button[aria-label*="Play" i], button[data-testid*="play" i]'
  );
  if (btn) {
    btn.click();
    return true;
  }
  return false;
}

function findNextChapterButton() {
  // Blinkist reader typically has a "Next" button to advance chapters.
  return (
    document.querySelector('button[aria-label*="Next" i]') ||
    document.querySelector('[data-testid*="next" i]') ||
    null
  );
}

let playerWired = false;
async function runPlayerMode() {
  const state = await getState();
  if (!state || state.status !== 'playing') {
    log('no active queue; player mode idle');
    return;
  }
  log('player mode active', state);

  const wireAudio = () => {
    const audio = findAudio();
    if (!audio || audio.dataset.bpaWired) return;
    audio.dataset.bpaWired = '1';
    playerWired = true;
    log('wired audio element', audio);

    audio.addEventListener('ended', async () => {
      log('audio ended');
      // Try to advance to next chapter within this book first.
      const nextBtn = findNextChapterButton();
      if (nextBtn && !nextBtn.disabled) {
        log('advancing chapter');
        nextBtn.click();
        setTimeout(() => clickPlayIfPaused(), 1200);
        return;
      }
      // No more chapters — advance to next book.
      log('no next chapter; advancing book');
      chrome.runtime.sendMessage({ type: 'BPA_NEXT' }, (resp) => log('next resp', resp));
    });

    // Kick off playback
    setTimeout(() => clickPlayIfPaused(), 600);
  };

  wireAudio();
  if (!playerWired) {
    const obs = new MutationObserver(() => {
      wireAudio();
      if (playerWired) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 20000);
  }
}

// ---------- ROUTER ----------

function boot() {
  log('booting on', location.href);
  if (isLibraryPage()) {
    runLibraryMode();
  } else if (isPlayerPage()) {
    runPlayerMode();
  }
}

boot();

// SPA navigation — re-run on URL changes
let lastHref = location.href;
new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    playerWired = false;
    boot();
  }
}).observe(document.body, { childList: true, subtree: true });
