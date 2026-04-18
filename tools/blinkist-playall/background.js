// Background service worker — orchestrates queue state and tab navigation.
// All runtime state lives in chrome.storage.local under the `bpa` key.
//
// Queue shape:
// {
//   status: 'idle' | 'playing' | 'paused',
//   items: [{ title, url, slug }],  // ordered, oldest-saved first, finished already filtered out
//   index: 0,
//   tabId: number | null,
//   startedAt: number
// }

const DEFAULT_STATE = {
  status: 'idle',
  items: [],
  index: 0,
  tabId: null,
  startedAt: 0,
};

async function getState() {
  const { bpa } = await chrome.storage.local.get('bpa');
  return { ...DEFAULT_STATE, ...(bpa || {}) };
}

async function setState(patch) {
  const current = await getState();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ bpa: next });
  return next;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case 'BPA_START': {
        // msg.items: [{title, url, slug}]
        const items = Array.isArray(msg.items) ? msg.items : [];
        if (items.length === 0) {
          sendResponse({ ok: false, error: 'empty_queue' });
          return;
        }
        const tabId = sender.tab?.id ?? null;
        await setState({
          status: 'playing',
          items,
          index: 0,
          tabId,
          startedAt: Date.now(),
        });
        if (tabId != null) {
          await chrome.tabs.update(tabId, { url: items[0].url });
        }
        sendResponse({ ok: true, count: items.length });
        return;
      }
      case 'BPA_NEXT': {
        const state = await getState();
        const nextIndex = state.index + 1;
        if (nextIndex >= state.items.length) {
          await setState({ status: 'idle', index: nextIndex });
          sendResponse({ ok: true, done: true });
          return;
        }
        const next = await setState({ index: nextIndex });
        const tabId = state.tabId ?? sender.tab?.id;
        if (tabId != null) {
          await chrome.tabs.update(tabId, { url: next.items[nextIndex].url });
        }
        sendResponse({ ok: true, index: nextIndex, url: next.items[nextIndex].url });
        return;
      }
      case 'BPA_PAUSE': {
        await setState({ status: 'paused' });
        sendResponse({ ok: true });
        return;
      }
      case 'BPA_RESUME': {
        await setState({ status: 'playing' });
        sendResponse({ ok: true });
        return;
      }
      case 'BPA_CLEAR': {
        await chrome.storage.local.set({ bpa: DEFAULT_STATE });
        sendResponse({ ok: true });
        return;
      }
      case 'BPA_GET_STATE': {
        sendResponse({ ok: true, state: await getState() });
        return;
      }
      default:
        sendResponse({ ok: false, error: 'unknown_message' });
    }
  })();
  return true; // async response
});
