import { useEffect, useMemo, useRef, useState } from "react";
import {
  rankLinkedInOutreach,
  summarizeLinkedInOutreach,
} from "../../lib/linkedin/queue";
import type {
  LinkedInDailyBatch,
  LinkedInOutreachPerson,
} from "../../lib/linkedin/types";

type QueueView = "priority" | "category";
type QueueStatus = "remaining" | "actioned" | "dismissed" | "all";
type QueueKind = "all" | "connect" | "follow" | "organization";

interface Props {
  initialPeople: LinkedInOutreachPerson[];
  initialDailyBatch: LinkedInDailyBatch;
}

interface ToastState {
  message: string;
  undo?: () => void;
}

const titleCase = (value: string) =>
  value.replace(/\b\w/g, (letter) => letter.toUpperCase());

function statusMatches(person: LinkedInOutreachPerson, status: QueueStatus): boolean {
  if (status === "remaining") return !person.actioned && !person.dismissed;
  if (status === "actioned") return person.actioned && !person.dismissed;
  if (status === "dismissed") return person.dismissed;
  return true;
}

/** The two per-person booleans the tracker can toggle. */
type PersonFlag = "actioned" | "dismissed";

const FLAG_ENDPOINT: Record<PersonFlag, "action" | "dismiss"> = {
  actioned: "action",
  dismissed: "dismiss",
};

function flagMessage(
  flag: PersonFlag,
  person: LinkedInOutreachPerson,
  value: boolean,
): string {
  if (flag === "dismissed") {
    return value ? "skipped / couldn't find. filed away." : "restored to the pile.";
  }
  if (!value) return "back in the queue.";
  return person.kind === "connect" ? "connected. nice." : "followed. radar tuned.";
}

export default function LinkedInTracker({ initialPeople, initialDailyBatch }: Props) {
  const [people, setPeople] = useState(initialPeople);
  const [view, setView] = useState<QueueView>("priority");
  const [query, setQuery] = useState("");
  const [batch, setBatch] = useState("today");
  const [kind, setKind] = useState<QueueKind>("all");
  const [tier, setTier] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<QueueStatus>("remaining");
  const [includeUnknown, setIncludeUnknown] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(100);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [ready, setReady] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const summary = useMemo(() => summarizeLinkedInOutreach(people), [people]);
  const dailyBatchPositions = useMemo(
    () => new Map(initialDailyBatch.stableIds.map((stableId, index) => [stableId, index])),
    [initialDailyBatch.stableIds],
  );
  const dailyBatchPeople = useMemo(
    () => people.filter((person) => dailyBatchPositions.has(person.stableId)),
    [dailyBatchPositions, people],
  );
  const dailyBatchSize = dailyBatchPeople.length;
  const dailyBatchRemaining = dailyBatchPeople.filter(
    (person) => !person.actioned && !person.dismissed,
  ).length;
  const rankedPeople = useMemo(() => rankLinkedInOutreach(people), [people]);
  const rankedPositions = useMemo(
    () => new Map(rankedPeople.map((person, index) => [person.stableId, index])),
    [rankedPeople],
  );
  const directedPool = rankedPeople.filter(
    (person) => person.kind !== "connect" || person.category !== "unknown",
  );
  const poolReviewed = directedPool.filter((person) => person.actioned || person.dismissed).length;
  const poolActioned = directedPool.filter((person) => person.actioned && !person.dismissed).length;
  const poolDismissed = directedPool.filter((person) => person.dismissed).length;
  const poolRemaining = directedPool.length - poolActioned - poolDismissed;
  const poolProgress = directedPool.length > 0
    ? Math.round((poolReviewed / directedPool.length) * 100)
    : 0;
  const unknownCount = people.filter(
    (person) => person.kind === "connect" && person.category === "unknown",
  ).length;

  const categories = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const person of people) {
      if (kind !== "all" && person.kind !== kind) continue;
      const current = counts.get(person.category) ?? {
        label: person.categoryLabel,
        count: 0,
      };
      current.count += 1;
      counts.set(person.category, current);
    }
    return [...counts.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [kind, people]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return people
      .filter((person) => kind === "all" || person.kind === kind)
      .filter((person) => statusMatches(person, status))
      .filter((person) => {
        if (batch === "today") return dailyBatchPositions.has(person.stableId);
        if (batch !== "all") return person.kind === "connect" && String(person.batch) === batch;
        return true;
      })
      .filter((person) => tier === "all" || (person.kind === "connect" && person.tier === tier))
      .filter((person) => category === "all" || person.category === category)
      .filter((person) => {
        if (includeUnknown || category === "unknown") return true;
        return person.kind !== "connect" || person.category !== "unknown";
      })
      .filter((person) => {
        if (!normalizedQuery) return true;
        return [
          person.name,
          person.organization,
          person.title,
          person.reason,
          person.categoryLabel,
        ].join(" ").toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (batch === "today") {
          return (dailyBatchPositions.get(a.stableId) ?? Number.MAX_SAFE_INTEGER) -
            (dailyBatchPositions.get(b.stableId) ?? Number.MAX_SAFE_INTEGER);
        }
        return (rankedPositions.get(a.stableId) ?? Number.MAX_SAFE_INTEGER) -
          (rankedPositions.get(b.stableId) ?? Number.MAX_SAFE_INTEGER);
      });
  }, [batch, category, dailyBatchPositions, includeUnknown, kind, people, query, rankedPositions, status, tier]);

  const visible = filtered.slice(0, visibleLimit);
  const grouped = useMemo(() => {
    if (view === "priority") {
      const label = batch === "today" ? "today's batch" : "full pile";
      return [[label, visible]] as Array<[
        string,
        LinkedInOutreachPerson[],
      ]>;
    }
    const buckets = new Map<string, LinkedInOutreachPerson[]>();
    for (const person of visible) {
      const bucket = buckets.get(person.category) ?? [];
      bucket.push(person);
      buckets.set(person.category, bucket);
    }
    return [...buckets.values()]
      .sort((a, b) =>
        (rankedPositions.get(a[0].stableId) ?? Number.MAX_SAFE_INTEGER) -
        (rankedPositions.get(b[0].stableId) ?? Number.MAX_SAFE_INTEGER))
      .map((bucket) => [titleCase(bucket[0].categoryLabel), bucket] as [
        string,
        LinkedInOutreachPerson[],
      ]);
  }, [batch, rankedPositions, view, visible]);

  useEffect(() => {
    setReady(true);
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  function announce(next: ToastState) {
    window.clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = window.setTimeout(
      () => setToast(null),
      next.undo ? 6_000 : 3_000,
    );
  }

  async function postMutation(path: "action" | "dismiss", body: object) {
    const response = await fetch(`/api/li/${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error ?? `save failed (${response.status})`);
    }
  }

  /** Optimistically flip `actioned` or `dismissed`, then persist; roll back if the save fails. */
  async function setFlag(
    flag: PersonFlag,
    person: LinkedInOutreachPerson,
    value: boolean,
    allowUndo = true,
  ) {
    const previous = person[flag];
    const applyLocally = (next: boolean) =>
      setPeople((current) => current.map((entry) =>
        entry.stableId === person.stableId ? { ...entry, [flag]: next } : entry));

    applyLocally(value);
    try {
      await postMutation(FLAG_ENDPOINT[flag], { id: person.stableId, [flag]: value });
      announce({
        message: flagMessage(flag, person, value),
        undo: allowUndo ? () => void setFlag(flag, person, previous, false) : undefined,
      });
    } catch (err) {
      applyLocally(previous);
      announce({ message: err instanceof Error ? err.message : "couldn't save that." });
    }
  }

  const setActioned = (person: LinkedInOutreachPerson, value: boolean) =>
    setFlag("actioned", person, value);
  const setDismissed = (person: LinkedInOutreachPerson, value: boolean) =>
    setFlag("dismissed", person, value);

  async function copyNote(note: string) {
    try {
      await navigator.clipboard.writeText(note);
      announce({ message: "note copied. go be charming." });
    } catch {
      announce({ message: "clipboard said nope — select the note manually." });
    }
  }

  return (
    <div
      className="li-page"
      data-daily-batch-date={initialDailyBatch.date}
      data-daily-batch-size={dailyBatchSize}
      data-connect-total={summary.connects}
      data-follow-total={summary.follows}
      data-organization-total={summary.organizations}
      data-kind={kind}
      data-ready={ready}
    >
      <a className="li-back" href="/">← stanwood.dev</a>

      <header className="li-masthead">
        <div className="li-title-wrap">
          <span className="li-title" aria-hidden="true">LI</span>
          <div>
            <h1>the LinkedIn pile</h1>
            <p>the 50 best next moves, all in one place.</p>
          </div>
        </div>
        <div className="li-rule-sticker">manual clicks only ✋</div>
      </header>

      <section className="li-scoreboard" aria-label="Overall progress">
        <div className="li-score-main">
          <span>left in the pool</span>
          <strong>{poolRemaining}</strong>
        </div>
        <div className="li-score-side">
          <div><strong>{poolReviewed}</strong><span>reviewed</span></div>
          <div><strong>{poolActioned}</strong><span>done</span></div>
          <div><strong>{poolDismissed}</strong><span>skipped</span></div>
        </div>
        <div className="li-progress" aria-label={`${poolProgress}% of the directed pool reviewed`}>
          <div style={{ width: `${poolProgress}%` }} />
          <span>{poolProgress}% through the pool</span>
        </div>
      </section>

      <div className="li-queue-rule">
        {batch === "today"
          ? `today's ${dailyBatchSize} — the highest-ranked connections, people follows, and organization follows at the overnight reset. no refills until tomorrow.`
          : "every card says connect, follow, or organization. your checks and passes teach the next overnight ranking."}
      </div>

      <section className="li-controls" aria-label="Queue filters">
        <label className="li-search">
          <span>find a person or organization</span>
          <input
            aria-label="search"
            type="search"
            value={query}
            placeholder="name, org, or reason"
            onChange={(event) => { setQuery(event.target.value); setVisibleLimit(100); }}
          />
        </label>
        <label>
          <span>batch</span>
          <select aria-label="batch" value={batch} onChange={(event) => { setBatch(event.target.value); setVisibleLimit(100); }}>
            <option value="today">today · {dailyBatchSize}</option>
            <option value="all">full pool</option>
            {(kind === "all" || kind === "connect") &&
              Array.from({ length: 11 }, (_, index) => index + 1).map((number) => (
                <option value={number} key={number}>connection batch {number}</option>
              ))}
          </select>
        </label>
        <label>
          <span>action</span>
          <select
            aria-label="action"
            value={kind}
            onChange={(event) => {
              const nextKind = event.target.value as QueueKind;
              setKind(nextKind);
              if ((nextKind === "follow" || nextKind === "organization") && batch !== "today") {
                setBatch("all");
              }
              setTier("all");
              setCategory("all");
              setVisibleLimit(100);
            }}
          >
            <option value="all">all three</option>
            <option value="connect">connections</option>
            <option value="follow">people follows</option>
            <option value="organization">organization follows</option>
          </select>
        </label>
        {(kind === "all" || kind === "connect") && (
          <label>
            <span>tier</span>
            <select aria-label="tier" value={tier} onChange={(event) => { setTier(event.target.value); setVisibleLimit(100); }}>
              <option value="all">all tiers</option>
              <option value="A">A · highest</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
        )}
        <label>
          <span>category</span>
          <select aria-label="category" value={category} onChange={(event) => { setCategory(event.target.value); setVisibleLimit(100); }}>
            <option value="all">all categories</option>
            {categories.map(([key, value]) => (
              <option value={key} key={key}>{titleCase(value.label)} · {value.count}</option>
            ))}
          </select>
        </label>
        <label>
          <span>status</span>
          <select aria-label="status" value={status} onChange={(event) => { setStatus(event.target.value as QueueStatus); setVisibleLimit(100); }}>
            <option value="remaining">still to do</option>
            <option value="actioned">done</option>
            <option value="dismissed">nah pile</option>
            <option value="all">everything</option>
          </select>
        </label>
      </section>

      <div className="li-viewbar">
        <div className="li-view-toggle" aria-label="Queue layout">
          <button
            type="button"
            aria-pressed={view === "priority"}
            onClick={() => { setView("priority"); setVisibleLimit(100); }}
          >priority pile</button>
          <button
            type="button"
            aria-pressed={view === "category"}
            onClick={() => { setView("category"); setVisibleLimit(100); }}
          >by category</button>
        </div>
        {batch !== "today" && (kind === "all" || kind === "connect") && (
          <label className="li-unknown">
            <input
              type="checkbox"
              checked={includeUnknown}
              onChange={(event) => { setIncludeUnknown(event.target.checked); setVisibleLimit(100); }}
            />
            include {unknownCount} mystery contacts
          </label>
        )}
        <div className="li-result-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "move" : "moves"}
          {filtered.length > visible.length ? ` · showing ${visible.length}` : ""}
        </div>
      </div>

      <div className="li-results" id="tracker-results">
        {visible.length === 0 ? (
          <div className="li-empty">
            {batch === "today" && dailyBatchRemaining === 0 ? (
              <>
                <div className="li-empty-title">
                  <span aria-hidden="true">✓</span>
                  <strong>TODAY'S BATCH: CLEARED.</strong>
                </div>
                <span>it stays empty until the overnight reset.</span>
              </>
            ) : (
              <>
                <strong>nothing here. weirdly satisfying.</strong>
                <span>try another filter or switch piles.</span>
              </>
            )}
          </div>
        ) : grouped.map(([label, entries]) => {
          const allInGroup = view === "priority"
            ? (batch === "today" ? dailyBatchPeople : filtered)
            : filtered.filter((person) => person.category === entries[0].category);
          const remaining = allInGroup.filter((person) => !person.actioned && !person.dismissed).length;
          return (
            <section className="li-group" key={label}>
              <div className="li-group-head">
                <h2>{label}</h2>
                <span>{remaining} left · {allInGroup.length} total</span>
              </div>
              <ul className="li-list">
                {entries.map((person) => (
                  <PersonCard
                    key={person.stableId}
                    person={person}
                    onActioned={(value) => void setActioned(person, value)}
                    onDismissed={(value) => void setDismissed(person, value)}
                    onCopy={copyNote}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {filtered.length > visible.length && (
        <button className="li-more" type="button" onClick={() => setVisibleLimit((value) => value + 100)}>
          load {Math.min(100, filtered.length - visible.length)} more ↓
        </button>
      )}

      {toast && (
        <div className="li-toast" role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.undo && (
            <button type="button" onClick={() => { const undo = toast.undo; setToast(null); undo?.(); }}>
              undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PersonCard({
  person,
  onActioned,
  onDismissed,
  onCopy,
}: {
  person: LinkedInOutreachPerson;
  onActioned: (value: boolean) => void;
  onDismissed: (value: boolean) => void;
  onCopy: (note: string) => void;
}) {
  const role = [...new Set([person.title, person.organization].filter(Boolean))].join(" · ");

  function openCardLink(event: React.MouseEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, label, summary, details")) return;
    window.open(person.linkedinUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <li
      className={`li-person kind-${person.kind}${person.actioned ? " is-done" : ""}${person.dismissed ? " is-dismissed" : ""}`}
      data-id={person.stableId}
      onClick={openCardLink}
    >
      <div className="li-person-main">
        <div className="li-identity">
          <h3>{person.name}</h3>
          <Badge>{person.kind}</Badge>
          {person.batch && <Badge>batch {person.batch}</Badge>}
          {person.tier && <Badge className={`tier-${person.tier.toLowerCase()}`}>tier {person.tier}</Badge>}
          <Badge>{titleCase(person.categoryLabel)}</Badge>
          {person.flags.map((flag) => (
            <Badge
              key={flag}
              className={flag.toLowerCase().startsWith("flag") ? "flag" : "annotation"}
            >[{flag}]</Badge>
          ))}
        </div>
        {role && <p className="li-role">{role}</p>}
        {person.reason && <p className="li-reason">{person.reason}</p>}
        <div className="li-meta">
          <span>{person.kind === "connect" ? `source: ${person.source}` : `priority: ${person.sourceOrder}`}</span>
          {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
          {person.kind === "follow" && !person.profileUrlFound && (
            <span>name search · no guessed profile</span>
          )}
          {person.kind === "organization" && !person.profileUrlFound && (
            <span>company search · no guessed page</span>
          )}
        </div>

        {person.noteDraft && (
          <details className="li-note">
            <summary>
              {person.noteNeedsEdit ? "note draft · needs one detail" : "note draft · ready to copy"}
            </summary>
            <div>
              <p>{person.noteDraft}</p>
              <footer>
                <span>{person.noteDraft.length}/300</span>
                <button type="button" onClick={() => onCopy(person.noteDraft!)}>copy note</button>
              </footer>
            </div>
          </details>
        )}
      </div>

      <div className="li-actions">
        <a
          className={`action-${person.kind}`}
          href={person.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {person.kind === "connect"
            ? "open to connect ↗"
            : person.kind === "follow" ? "open to follow ↗" : "open company ↗"}
        </a>
        <label className="li-done">
          <input
            type="checkbox"
            checked={person.actioned}
            disabled={person.dismissed}
            aria-label={person.kind === "connect"
              ? `Mark ${person.name} connected`
              : `Mark ${person.name} followed`}
            onChange={(event) => onActioned(event.target.checked)}
          />
          <span aria-hidden="true">✓</span>
        </label>
        {person.dismissed ? (
          <button type="button" className="restore" onClick={() => onDismissed(false)}>restore</button>
        ) : (
          <button
            type="button"
            className="nah"
            aria-label={`Skip ${person.name} or mark as not found`}
            title="Skip / couldn't find"
            onClick={() => onDismissed(true)}
          ><span aria-hidden="true">×</span></button>
        )}
      </div>
    </li>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`li-badge ${className}`.trim()}>{children}</span>;
}
