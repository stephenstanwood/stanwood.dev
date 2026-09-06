import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BedDouble, Bath, Check, ChevronLeft, ChevronRight, Heart,
  House, MapPin, MoveUpRight, RotateCcw, School, SlidersHorizontal, Sparkles, Sprout, X,
  LogOut, Footprints, NotebookPen, CheckCheck, Info, RefreshCw, Images } from 'lucide-react';
import ScatosLogo from './ScatosLogo';
import type { Choice, Decision, Home, ScatosState } from '../../lib/scatos/types';

type Tab = 'browse' | 'saved' | 'matches' | 'passed';
type Filters = { maxPrice: number; minBeds: number; vanMeter: boolean; fisher: boolean; nearTown: boolean };
const DEFAULT_FILTERS: Filters = { maxPrice: 4_000_000, minBeds: 4, vanMeter: false, fisher: false, nearTown: false };
const dollars = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const number = (value: number | null) => value ? value.toLocaleString('en-US') : '—';
const isVanMeter = (home: Home) => /Van Meter/i.test(home.schools.elementary || '');
const isFisher = (home: Home) => /Fisher/i.test(home.schools.middle || '');
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
const name = (profile: string) => profile === 'stephen' ? 'Stephen' : 'Madeleine';
const partnerName = (profile: string) => name(profile === 'stephen' ? 'madeleine' : 'stephen');

// Header copy per tab, and the copy shown when a list tab has nothing in it.
// `browse` has its own two empty states (all caught up vs. filtered to nothing),
// so it only appears in the header table.
const TAB_INTRO: Record<Tab, { title: string; blurb: string }> = {
  browse: { title: 'Maybe this is the one.', blurb: 'Just looking is a very good place to start.' },
  saved: { title: 'A little collection of maybes.', blurb: 'Keep the houses—and the ideas—you love.' },
  matches: { title: 'Your tastes have good taste.', blurb: 'The homes you’ve both quietly fallen for.' },
  passed: { title: 'Not quite your kind of place.', blurb: 'Changed your mind? Every home gets another chance.' },
};
const EMPTY_LIST: Record<Exclude<Tab, 'browse'>, { title: string; blurb: (partner: string) => string }> = {
  saved: { title: 'Room for a few house crushes.', blurb: () => 'Save a home while you explore. Come back to it whenever.' },
  matches: { title: 'A shared crush is coming.', blurb: partner => `When you and ${partner} save the same home, it lands here.` },
  passed: { title: 'A clean slate.', blurb: () => 'Homes you pass on will appear here.' },
};

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={`sc-modal${wide ? ' wide' : ''}`} onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    } }} aria-label={title}>
    <div className="sc-modal-head"><h2>{title}</h2><button type="button" className="sc-icon" onClick={onClose} aria-label="Close dialog"><X size={22} /></button></div>
    {children}
  </dialog>;
}

function Photo({ home, compact = false }: { home: Home; compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setIndex(0); setFailed(false); }, [home.id]);
  function next(delta: number) { setFailed(false); setIndex(i => (i + delta + home.photos.length) % home.photos.length); }
  return <div className={`sc-photo${compact ? ' compact' : ''}`}>
    {home.photos[index] && !failed ? <img src={home.photos[index]} alt={`${home.address}, listing photo ${index + 1}`}
      draggable={false} loading={compact ? 'lazy' : 'eager'} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : <div className="sc-photo-fallback"><House size={54} strokeWidth={1.3} /><span>Photos are on the listing</span></div>}
    {!compact && home.photos.length > 1 && <>
      <button type="button" className="sc-photo-arrow previous" aria-label="Previous photo" onClick={event => { event.stopPropagation(); next(-1); }}><ChevronLeft size={24} /></button>
      <button type="button" className="sc-photo-arrow next" aria-label="Next photo" onClick={event => { event.stopPropagation(); next(1); }}><ChevronRight size={24} /></button>
      <span className="sc-photo-count"><Images size={14} /> {index + 1} / {home.photos.length}</span>
    </>}
    {home.status === 'archived' && <span className="sc-photo-label archived">Saved inspiration</span>}
    {home.status === 'active' && isVanMeter(home) && <span className="sc-photo-label"><Sparkles size={14} /> {isFisher(home) ? 'Van Meter + Fisher' : 'Van Meter Elementary'}</span>}
  </div>;
}

function SchoolBadges({ home }: { home: Home }) {
  return <div className="sc-badges">
    <span className="sc-badge school"><School size={14} /> Los Gatos High <Check size={13} /></span>
    {isVanMeter(home) && <span className="sc-badge bonus">Van Meter</span>}
    {isFisher(home) && <span className="sc-badge bonus">Fisher</span>}
  </div>;
}

function FiltersForm({ filters, setFilters, count }: { filters: Filters; setFilters: (filters: Filters) => void; count: number }) {
  return <div className="sc-filter-form">
    <div className="sc-fixed-rule"><School size={20} /><div><strong>Los Gatos High</strong><span>Always required. Boundary checked.</span></div><Check size={17} /></div>
    <label className="sc-field">Up to <strong>{dollars(filters.maxPrice)}</strong>
      <input type="range" min="1000000" max="4000000" step="100000" value={filters.maxPrice}
        aria-label="Maximum price" onChange={event => setFilters({ ...filters, maxPrice: Number(event.target.value) })} />
      <span className="sc-range-labels"><span>$1M</span><span>$4M</span></span>
    </label>
    <label className="sc-field">Room for everyone
      <select value={filters.minBeds} aria-label="Minimum bedrooms" onChange={event => setFilters({ ...filters, minBeds: Number(event.target.value) })}>
        <option value={4}>4+ bedrooms</option><option value={5}>5+ bedrooms</option><option value={6}>6+ bedrooms</option>
      </select>
    </label>
    <p className="sc-fine">Detached houses. At least 2 baths.</p>
    <div className="sc-bonus-controls"><h3>A little more particular?</h3>
      {([['vanMeter', 'Van Meter Elementary'], ['fisher', 'Fisher Middle'], ['nearTown', 'Within 1 mile of Town Plaza']] as const).map(([key, label]) =>
        <label className="sc-toggle" key={key}><input type="checkbox" checked={filters[key]} onChange={event => setFilters({ ...filters, [key]: event.target.checked })} /><span>{label}</span></label>)}
      <p className="sc-fine">Town distance is straight-line. Check the walking route on the map.</p>
    </div>
    <div className="sc-filter-bottom"><span>{count} {count === 1 ? 'home fits' : 'homes fit'}</span><button type="button" className="sc-text-button" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button></div>
  </div>;
}

function Detail({ home, choice, matched, onClose, onSave, busy }: { home: Home; choice?: Choice; matched: boolean;
  onClose: () => void; onSave: (home: Home, decision: Decision, note?: string) => Promise<void>; busy: boolean }) {
  const [note, setNote] = useState(choice?.note || '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [detailError, setDetailError] = useState('');
  const maps = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(home.address + ', Los Gatos, CA ' + home.zip)}&destination=Los+Gatos+Town+Plaza&travelmode=walking`;
  return <Modal title={home.address} onClose={onClose} wide>
    <Photo home={home} />
    <div className="sc-detail-body">
      <div className="sc-detail-price"><strong>{dollars(home.price)}</strong>{matched && <span className="sc-badge match"><Heart size={14} fill="currentColor" /> You both saved it</span>}</div>
      <p className="sc-location">Los Gatos, CA {home.zip}</p><SchoolBadges home={home} />
      <div className="sc-detail-facts">{[[number(home.beds), 'beds'], [number(home.baths), 'baths'], [number(home.sqft), 'sq ft inside'], [number(home.lotSqft), 'sq ft lot']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      {home.status === 'archived' && <p className="sc-callout">This home is no longer in the verified active feed. Keep it here for the things you love about it. The price is the last observed asking price.</p>}
      <section><h3><School size={19} /> The school path</h3><dl className="sc-school-path">
        <div><dt>Elementary</dt><dd>{home.schools.elementary || 'Assignment not verified'}</dd></div>
        <div><dt>Middle</dt><dd>{home.schools.middle || 'Assignment not verified'}</dd></div>
        <div><dt>High</dt><dd>Los Gatos High School <Check size={15} /></dd></div>
      </dl><p className="sc-fine">District boundaries checked {dateLabel(home.schools.verifiedAt)} using the listing’s map location. Confirm the exact address with the district before buying.</p>
      <div className="sc-links"><a href={home.schools.highSource} target="_blank" rel="noopener noreferrer">High-school boundary result <MoveUpRight size={14} /></a><a href="https://www.schoolsitelocator.com/apps/losgatos/" target="_blank" rel="noopener noreferrer">Elementary & middle locator <MoveUpRight size={14} /></a></div></section>
      <section><h3><Sprout size={19} /> The everyday stuff</h3><p>{home.yard}. {home.lotSqft ? `The whole lot is ${number(home.lotSqft)} sq ft; usable play space needs a look at the photos or a visit.` : 'Usable play space needs a look at the photos or a visit.'}</p>
      {home.features.length > 0 && <div className="sc-badges">{home.features.map(feature => <span className="sc-badge neutral" key={feature}>{feature}</span>)}</div>}
      <p>{home.townMiles} miles from Town Plaza, straight-line.{home.walkableClaim ? ' The listing mentions walking into town.' : ''}</p><a className="sc-inline-link" href={maps} target="_blank" rel="noopener noreferrer"><Footprints size={16} /> Check the actual walk <MoveUpRight size={14} /></a></section>
      <section><h3><NotebookPen size={19} /> What caught your eye?</h3><label className="sc-sr-only" htmlFor="sc-note">Your private note for {home.address}</label><textarea id="sc-note" maxLength={1000} value={note} onChange={event => { setNote(event.target.value); setNoteSaved(false); }} placeholder="The kitchen. That yard. Room for an office…" rows={3} />
        <div className="sc-note-bottom"><span className="sc-fine">Your note, saved with this home.</span><button type="button" className="sc-small-button" disabled={busy} onClick={async () => { try { await onSave(home, choice?.decision || 'save', note); setNoteSaved(true); setDetailError(''); } catch { setDetailError('Your note wasn’t saved. Please try again.'); } }}>{noteSaved ? 'Note saved' : 'Save note'}</button></div></section>
      <section className="sc-listing-source"><h3>Take a closer look</h3><div className="sc-links">{home.sources.map(source => <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer">{source.name} <MoveUpRight size={14} /></a>)}</div><p className="sc-fine">Listing and photos courtesy of {home.office || 'the listing brokerage'}. MLS {home.id}. Checked {dateLabel(home.checkedAt)}.</p></section>
      {detailError && <p className="sc-error" role="alert">{detailError}</p>}
      <button type="button" className="sc-primary" disabled={busy} onClick={async () => { try { await onSave(home, choice?.decision === 'save' ? 'pass' : 'save'); onClose(); } catch { setDetailError('That change wasn’t saved. Please try again.'); } }}><Heart size={19} fill={choice?.decision === 'save' ? 'currentColor' : 'none'} />{choice?.decision === 'save' ? 'Remove from my saved homes' : 'Save this home'}</button>
    </div>
  </Modal>;
}

export default function ScatosSwip() {
  const [state, setState] = useState<ScatosState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('browse');
  const [browsingId, setBrowsingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [detail, setDetail] = useState<Home | null>(null);
  const [undo, setUndo] = useState<{ id: string; previous?: Choice } | null>(null);
  const [toast, setToast] = useState('');
  const [matchHome, setMatchHome] = useState<Home | null>(null);
  const [drag, setDrag] = useState(0);
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null);
  const busyRef = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async (quiet = false) => {
    try {
      const response = await fetch('/api/lg/state', { cache: 'no-store' });
      if (response.status === 401) { window.location.assign('/lg/login'); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!busyRef.current) { setState(data); setError(''); }
    } catch (err) { if (!quiet) setError(err instanceof Error ? err.message : 'Your homes could not load. Try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { if (!document.hidden && !busyRef.current) void load(true); };
    const interval = setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(interval); clearTimeout(timeout.current); window.removeEventListener('focus', refresh); };
  }, [load]);
  useEffect(() => {
    if (!state?.profile) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`scatos-filters-${state.profile}`) || 'null');
      if (saved && Number.isFinite(saved.maxPrice) && saved.maxPrice >= 1_000_000 && saved.maxPrice <= 4_000_000 && [4, 5, 6].includes(saved.minBeds))
        setFilters({ maxPrice: saved.maxPrice, minBeds: saved.minBeds, vanMeter: saved.vanMeter === true, fisher: saved.fisher === true, nearTown: saved.nearTown === true });
    } catch { /* Private browsing may disable local storage. Swipes still sync. */ }
  }, [state?.profile]);
  function changeFilters(next: Filters) {
    setFilters(next); setBrowsingId(null);
    try { localStorage.setItem(`scatos-filters-${state?.profile}`, JSON.stringify(next)); } catch { /* optional preference */ }
  }
  const choices = useMemo(() => new Map((state?.choices || []).map(choice => [choice.id, choice])), [state?.choices]);
  const matches = useMemo(() => new Set(state?.matches || []), [state?.matches]);
  const eligible = useMemo(() => (state?.homes || []).filter(home => home.status === 'active' && home.price <= filters.maxPrice && home.beds >= filters.minBeds
    && (!filters.vanMeter || isVanMeter(home)) && (!filters.fisher || isFisher(home)) && (!filters.nearTown || home.townMiles <= 1)), [state?.homes, filters]);
  const deck = eligible.filter(home => !choices.has(home.id));
  const currentIndex = Math.max(0, deck.findIndex(home => home.id === browsingId));
  const current = deck[currentIndex];
  function browse(delta: number) {
    if (busyRef.current || deck.length < 2) return;
    setBrowsingId(deck[(currentIndex + delta + deck.length) % deck.length].id);
    setDrag(0);
  }
  const savedHomes = (state?.homes || []).filter(home => choices.get(home.id)?.decision === 'save');
  const matchedHomes = savedHomes.filter(home => matches.has(home.id));
  const passedHomes = (state?.homes || []).filter(home => choices.get(home.id)?.decision === 'pass');
  const gridHomes = tab === 'saved' ? savedHomes : tab === 'matches' ? matchedHomes : passedHomes;
  const notice = (message: string) => { setToast(message); clearTimeout(timeout.current); timeout.current = setTimeout(() => setToast(''), 4000); };

  async function save(home: Home, decision: Decision, note?: string) {
    if (busyRef.current) return;
    const previous = choices.get(home.id);
    busyRef.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/lg/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: home.id, decision, ...(note !== undefined ? { note } : {}) }) });
      if (response.status === 401) { window.location.assign('/lg/login'); throw new Error('Please sign in again.'); }
      const data: ScatosState & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || 'That change wasn’t saved. Please try again.');
      if (home.id === current?.id) {
        const next = deck[(currentIndex + 1) % deck.length];
        setBrowsingId(next?.id !== home.id ? next?.id || null : null);
      }
      setState(data); setUndo({ id: home.id, previous });
      if (decision === 'save' && data.matches.includes(home.id) && !matches.has(home.id)) setMatchHome(home);
      else if (note === undefined) notice(decision === 'save' ? 'Saved for someday.' : 'Passed. There’s no rush.');
    } catch (err) { setError(err instanceof Error ? err.message : 'That change wasn’t saved.'); throw err; }
    finally { busyRef.current = false; setBusy(false); setDrag(0); }
  }
  async function undoLast() {
    if (!undo || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const response = await fetch('/api/lg/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: undo.id, decision: undo.previous?.decision || null, note: undo.previous?.note || '' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Undo wasn’t saved. Try again.');
      setState(data); setBrowsingId(undo.id); setUndo(null); notice('Back where it was.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Undo failed.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (tab !== 'browse' || !current || busy || detail || infoOpen || filterOpen || matchHome
          || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName) && !event.target.closest('.sc-browse-controls')) || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); browse(event.key === 'ArrowRight' ? 1 : -1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const onPointerDown = (event: React.PointerEvent) => {
    if (busy || event.button !== 0 || (event.target as HTMLElement).closest('button,a')) return;
    pointer.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) { pointer.current = null; setDrag(0); return; }
    if (Math.abs(dx) > 10) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrag(Math.max(-155, Math.min(155, dx)));
    }
  };
  const onPointerUp = () => {
    pointer.current = null;
    if (Math.abs(drag) > 85 && current) void save(current, drag > 0 ? 'save' : 'pass').catch(() => {});
    setDrag(0);
  };
  const filterCount = Number(filters.maxPrice !== 4_000_000) + Number(filters.minBeds !== 4) + Number(filters.vanMeter) + Number(filters.fisher) + Number(filters.nearTown);
  const profile = state?.profile || 'stephen';
  const stale = Boolean(state?.feed?.generatedAt && Date.now() - Date.parse(state.feed.generatedAt) > 36 * 3600_000);
  return <div className="sc-app" data-ready={Boolean(state)}>
    <header className="sc-header"><a href="/lg" className="sc-brand-link" aria-label="ScatosSwip home"><ScatosLogo /></a><span className="sc-header-note">A home crush, at your own pace.</span>
      <div className="sc-account"><span className={`sc-avatar ${profile}`}>{name(profile).slice(0, 1)}</span><span>{name(profile)}</span><a href="/lg/login" className="sc-switch" title="Switch profile">Switch</a><form action="/lg/logout" method="post"><button type="submit" className="sc-icon" aria-label="Sign out"><LogOut size={17} /></button></form></div>
    </header>
    <nav className="sc-tabs" aria-label="Your homes">{([
      ['browse', 'Explore', House, deck.length], ['saved', 'My saves', Heart, savedHomes.length],
      ['matches', 'Our matches', CheckCheck, matchedHomes.length], ['passed', 'Passed', RotateCcw, passedHomes.length],
    ] as const).map(([key, label, Icon, count]) => <button type="button" key={key} className={tab === key ? 'active' : ''} aria-current={tab === key ? 'page' : undefined} onClick={() => { setTab(key); setError(''); }}><Icon size={18} /><span>{label}</span>{count > 0 && <small>{count}</small>}</button>)}</nav>
    <div className="sc-layout"><aside className="sc-sidebar"><div className="sc-wish-title"><span className="sc-small-flower" aria-hidden="true">✳</span><h2>The wish list</h2></div><FiltersForm filters={filters} setFilters={changeFilters} count={eligible.length} />
      <div className="sc-sidebar-note"><Heart size={21} /><p>Somewhere for all the little things.</p><span>A yard. A guest room. A walk into town.</span></div></aside>
      <section className="sc-main" aria-label="House browsing"><div className="sc-intro"><div><h1>{TAB_INTRO[tab].title}</h1><p>{TAB_INTRO[tab].blurb}</p></div>
        {tab === 'browse' && <button type="button" className="sc-filter-button" aria-label="Filters" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={18} /><span>Filters{filterCount ? ` (${filterCount})` : ''}</span></button>}</div>
        {error && <div role="alert" className="sc-error"><p>{error}</p><button type="button" onClick={() => void load()}><RefreshCw size={15} /> Try again</button></div>}
        {state && (stale || state.feed?.lastError || !state.feed?.complete) && <p className="sc-feed-notice"><Info size={17} />{state.feed?.lastError || 'The feed is due for a fresh check. Showing the last verified homes.'}</p>}
        {loading ? <div className="sc-loading"><span className="sc-loading-house"><House size={42} /></span><h2>Finding your little corner of Los Gatos…</h2><p>Getting the latest school-checked homes.</p></div>
          : !state ? <div className="sc-empty"><House size={44} /><h2>Your homes are taking a moment.</h2><button className="sc-primary" type="button" onClick={() => { setLoading(true); void load(); }}>Try again</button></div>
          : tab === 'browse' ? current ? <>
            <div className="sc-browse-controls" role="group" aria-label="Browse without choosing">
              <button type="button" aria-label="Previous home" disabled={busy || deck.length < 2} onClick={() => browse(-1)}><ArrowLeft size={17} /> Previous</button>
              <span className="sc-browse-position" aria-live="polite">{currentIndex + 1} of {deck.length}<small>No choice needed</small></span>
              <button type="button" aria-label="Next home" disabled={busy || deck.length < 2} onClick={() => browse(1)}>Next <ArrowRight size={17} /></button>
            </div>
            <div className="sc-deck"><div className="sc-card-under" aria-hidden="true" /><article className={`sc-swipe-card${busy ? ' is-saving' : ''}`} style={{ transform: `translateX(${drag}px) rotate(${drag / 22}deg)` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { pointer.current = null; setDrag(0); }}>
              {Math.abs(drag) > 24 && <span className={`sc-swipe-stamp ${drag > 0 ? 'save' : 'pass'}`}>{drag > 0 ? 'Someday?' : 'Not quite'}</span>}
              <Photo key={current.id} home={current} />
              <div className="sc-card-content"><div className="sc-price-line"><strong>{dollars(current.price)}</strong><span className="sc-live-label"><span /> For sale</span></div>
                {current.previousPrice && current.previousPrice > current.price && <p className="sc-price-change">Down {dollars(current.previousPrice - current.price)} since our last price check</p>}
                <h2><button type="button" onClick={() => setDetail(current)}>{current.address}<MoveUpRight size={21} /></button></h2><p className="sc-location"><MapPin size={14} /> Los Gatos, CA {current.zip}</p>
                <div className="sc-house-facts"><span><BedDouble size={18} /><strong>{current.beds}</strong> beds</span><span><Bath size={18} /><strong>{current.baths}</strong> baths</span><span><strong>{number(current.sqft)}</strong> sq ft</span></div>
                <SchoolBadges home={current} />
                <div className="sc-house-notes"><span><Sprout size={17} />{current.yard}</span><span><Footprints size={17} />{current.townMiles} mi to Town Plaza <small>(straight-line)</small></span></div>
                <div className="sc-card-footer"><span>{current.office}</span><button type="button" className="sc-text-button" onClick={() => setDetail(current)}>The little details <MoveUpRight size={15} /></button></div>
              </div>
            </article></div>
            <div className="sc-swipe-actions"><button type="button" className="sc-action pass" disabled={busy} onClick={() => void save(current, 'pass').catch(() => {})}><span><X size={27} /></span>Not quite</button>
              <button type="button" className="sc-action undo" disabled={!undo || busy} onClick={() => void undoLast()}><span><RotateCcw size={19} /></span>Undo</button>
              <button type="button" className="sc-action save" disabled={busy} onClick={() => void save(current, 'save').catch(() => {})}><span><Heart size={27} /></span>Save for someday</button></div>
            <p className="sc-swipe-hint"><span className="sc-desktop-hint"><ArrowLeft size={13} /> <ArrowRight size={13} /> Arrow keys browse. No choice needed.</span><span className="sc-mobile-hint">Swipe left to pass. Right to save.</span><span>{deck.length} {deck.length === 1 ? 'home' : 'homes'} to explore</span></p>
          </> : <div className="sc-empty"><div className="sc-empty-art"><House size={52} strokeWidth={1.5} /><Sparkles size={27} /></div><h2>{eligible.length ? 'All caught up. Go live a little.' : 'A little too particular—for today.'}</h2><p>{eligible.length ? 'Fresh finds arrive in the morning. Your saved homes aren’t going anywhere.' : 'Try easing a bonus filter. Los Gatos High stays a must.'}</p><button className="sc-primary" type="button" onClick={() => eligible.length ? setTab('saved') : changeFilters(DEFAULT_FILTERS)}>{eligible.length ? 'Visit my saved homes' : 'Reset bonus filters'}</button>{undo && <button type="button" className="sc-text-button" disabled={busy} onClick={() => void undoLast()}>Undo last swipe</button>}</div>
          : gridHomes.length ? <div className="sc-home-grid">{gridHomes.map(home => <article key={home.id} className="sc-mini-card"><button type="button" className="sc-mini-open" onClick={() => setDetail(home)} aria-label={`View ${home.address}`}><Photo home={home} compact /><div className="sc-mini-copy"><strong>{dollars(home.price)}</strong><h2>{home.address}</h2><p>{home.beds} beds <span>•</span> {home.baths} baths <span>•</span> {number(home.sqft)} sq ft</p></div></button><div className="sc-mini-bottom">{matches.has(home.id) ? <span className="sc-badge match"><Heart size={13} fill="currentColor" /> Both of you</span> : <span className="sc-fine">{home.status === 'active' ? 'For sale' : 'Saved inspiration'}</span>}<button type="button" className="sc-icon" aria-label={tab === 'passed' ? `Save ${home.address}` : `Remove ${home.address} from saves`} disabled={busy} onClick={() => void save(home, tab === 'passed' ? 'save' : 'pass').catch(() => {})}>{tab === 'passed' ? <Heart size={18} /> : <X size={18} />}</button></div>{choices.get(home.id)?.note && <p className="sc-mini-note"><NotebookPen size={14} />{choices.get(home.id)?.note}</p>}</article>)}</div>
          : <div className="sc-empty"><div className="sc-empty-art"><Heart size={50} strokeWidth={1.5} /><Sparkles size={25} /></div><h2>{EMPTY_LIST[tab].title}</h2><p>{EMPTY_LIST[tab].blurb(partnerName(profile))}</p><button className="sc-primary" type="button" onClick={() => setTab('browse')}>Explore homes</button></div>}
      </section>
      <aside className="sc-right-rail"><div className="sc-someday-note"><span className="sc-note-sun" aria-hidden="true">✺</span><h2>A place for<br />your next chapter.</h2><p>No countdown.<br />No pressure.<br />Just possibilities.</p><div className="sc-note-houses" aria-hidden="true"><House size={32} strokeWidth={1.5} /><Sprout size={28} strokeWidth={1.5} /></div></div>
        <div className="sc-together"><div className="sc-avatar-pair"><span className="sc-avatar stephen">S</span><span className="sc-avatar madeleine">M</span><Heart size={17} fill="currentColor" /></div><h2>{matchedHomes.length ? `${matchedHomes.length} shared ${matchedHomes.length === 1 ? 'crush' : 'crushes'}` : 'Two swipes. One someday.'}</h2><p>Save separately. See what you both love.</p><button type="button" className="sc-text-button" onClick={() => setTab('matches')}>Our matches <MoveUpRight size={15} /></button></div>
      </aside>
    </div>
    <footer className="sc-footer"><span><span className="sc-refresh-dot" />{state?.feed ? `Checked ${dateLabel(state.feed.generatedAt)}. Fresh finds daily at 4:45 a.m. Pacific.` : 'Fresh finds daily at 4:45 a.m. Pacific.'}</span><button type="button" className="sc-text-button" onClick={() => setInfoOpen(true)}><Info size={15} /> Sources & the fine print</button></footer>
    <div className="sc-toast" role="status" aria-live="polite">{toast && <span><Check size={17} />{toast}</span>}</div>
    {filterOpen && <Modal title="The wish list" onClose={() => setFilterOpen(false)}><FiltersForm filters={filters} setFilters={changeFilters} count={eligible.length} /><button type="button" className="sc-primary" onClick={() => setFilterOpen(false)}>Explore {eligible.length} {eligible.length === 1 ? 'home' : 'homes'}</button></Modal>}
    {detail && <Detail home={state?.homes.find(home => home.id === detail.id) || detail} choice={choices.get(detail.id)} matched={matches.has(detail.id)} busy={busy} onClose={() => setDetail(null)} onSave={save} />}
    {matchHome && <Modal title="Oh, you both like this one." onClose={() => setMatchHome(null)}><div className="sc-match-celebration"><div className="sc-match-hearts" aria-hidden="true"><Heart size={62} fill="currentColor" /><Sparkles size={32} /></div><p>A shared house crush.<br />That’s a lovely place to start.</p><Photo home={matchHome} compact /><h3>{matchHome.address}</h3><button type="button" className="sc-primary" onClick={() => { setMatchHome(null); setTab('matches'); }}>See our matches</button><button type="button" className="sc-text-button" onClick={() => setMatchHome(null)}>Keep exploring</button></div></Modal>}
    {infoOpen && <Modal title="Good homes. Clear sources." onClose={() => setInfoOpen(false)}><div className="sc-info-body"><p>First, the official Los Gatos High attendance boundary. Then Los Gatos addresses, detached houses, 4+ bedrooms, 2+ bathrooms, and an asking price up to $4 million.</p>
      <h3>Where the homes come from</h3>{state?.feed?.sources.map(source => <div className="sc-source-row" key={source.name}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} <MoveUpRight size={14} /></a><span>{source.status === 'ok' ? 'Checked' : 'Check unavailable'}</span></div>)}
      <p className="sc-fine">MLSListings is the original local MLS feed, including participating brokerages and partner MLSs. GoReal provides a second public listing index. Duplicate homes appear once. No feed can promise every private or off-market listing.</p>
      <h3>What the bonuses mean</h3><p>Van Meter and Fisher use the district’s published attendance areas. Yard labels come from listing descriptions; lot size is not usable lawn area. Distance to Town Plaza is straight-line, not a walking time.</p>
      <h3>Made for a someday move</h3><p>Your saves and notes stay in your private collection when a home leaves the active feed. Each of you has a separate profile. Matches appear when you both save the same home.</p>
      <h3>School timing</h3><p>Under current California rules, a February 2024 birthday means TK in fall 2028 and kindergarten in fall 2029. LGUSD currently offers TK at all four elementary schools; TK placement may differ from the home school used for kindergarten.</p><a className="sc-inline-link" href="https://www.lgusd.org/apps/pages/index.jsp?uREC_ID=2893247&type=d&pREC_ID=2548876" target="_blank" rel="noopener noreferrer">Current LGUSD TK policy <MoveUpRight size={14} /></a>
      <h3>The morning refresh</h3><p>The Mac Mini checks listings every day at 4:45 a.m. Pacific. If a source fails, the last verified homes are kept. Listings not verified for 72 hours leave the active deck; saved examples remain.</p><p className="sc-fine">Listing photos belong to their respective brokers and photographers. Use the source links for complete and current listing details.</p></div></Modal>}
  </div>;
}
