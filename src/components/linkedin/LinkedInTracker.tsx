import { useEffect, useMemo, useRef, useState } from "react";
import {
  compareLinkedInPriority,
  currentLinkedInBatch,
  summarizeLinkedInOutreach,
} from "../../lib/linkedin/queue";
import type {
  LinkedInOutreachKind,
  LinkedInOutreachPerson,
} from "../../lib/linkedin/types";

type QueueView = "priority" | "category";
type QueueStatus = "remaining" | "actioned" | "dismissed" | "all";

interface Props {
  initialPeople: LinkedInOutreachPerson[];
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

export default function LinkedInTracker({ initialPeople }: Props) {
  const [people, setPeople] = useState(initialPeople);
  const [lane, setLane] = useState<LinkedInOutreachKind>("connect");
  const [view, setView] = useState<QueueView>("priority");
  const [query, setQuery] = useState("");
  const [batch, setBatch] = useState("current");
  const [tier, setTier] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<QueueStatus>("remaining");
  const [includeUnknown, setIncludeUnknown] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(100);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [ready, setReady] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const summary = useMemo(() => summarizeLinkedInOutreach(people), [people]);
  const currentBatch = useMemo(() => currentLinkedInBatch(people), [people]);
  const lanePeople = useMemo(
    () => people.filter((person) => person.kind === lane),
    [lane, people],
  );
  const laneReviewed = lanePeople.filter((person) => person.actioned || person.dismissed).length;
  const laneProgress = lanePeople.length > 0
    ? Math.round((laneReviewed / lanePeople.length) * 100)
    : 0;
  const unknownCount = people.filter(
    (person) => person.kind === "connect" && person.category === "unknown",
  ).length;

  const categories = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const person of lanePeople) {
      const current = counts.get(person.category) ?? {
        label: person.categoryLabel,
        count: 0,
      };
      current.count += 1;
      counts.set(person.category, current);
    }
    return [...counts.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [lanePeople]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return lanePeople
      .filter((person) => statusMatches(person, status))
      .filter((person) => {
        if (lane !== "connect") return true;
        if (batch === "current") return person.batch === currentBatch;
        if (batch !== "all") return String(person.batch) === batch;
        return true;
      })
      .filter((person) => tier === "all" || person.tier === tier)
      .filter((person) => category === "all" || person.category === category)
      .filter((person) => {
        if (lane !== "connect" || includeUnknown || category === "unknown") return true;
        return person.category !== "unknown";
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
      .sort(compareLinkedInPriority);
  }, [batch, category, currentBatch, includeUnknown, lane, lanePeople, query, status, tier]);

  const visible = filtered.slice(0, visibleLimit);
  const grouped = useMemo(() => {
    if (view === "priority") {
      return [[lane === "connect" ? "priority queue" : "follow queue", visible]] as Array<[
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
      .sort((a, b) => compareLinkedInPriority(a[0], b[0]))
      .map((bucket) => [titleCase(bucket[0].categoryLabel), bucket] as [
        string,
        LinkedInOutreachPerson[],
      ]);
  }, [lane, view, visible]);

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

  function resetLane(nextLane: LinkedInOutreachKind) {
    setLane(nextLane);
    setView("priority");
    setQuery("");
    setBatch("current");
    setTier("all");
    setCategory("all");
    setStatus("remaining");
    setIncludeUnknown(false);
    setVisibleLimit(100);
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

  async function setActioned(
    person: LinkedInOutreachPerson,
    value: boolean,
    allowUndo = true,
  ) {
    const previous = person.actioned;
    setPeople((current) => current.map((entry) =>
      entry.stableId === person.stableId ? { ...entry, actioned: value } : entry));
    try {
      await postMutation("action", { id: person.stableId, actioned: value });
      announce({
        message: value ? "nice. one less in the pile." : "back in the queue.",
        undo: allowUndo ? () => void setActioned(person, previous, false) : undefined,
      });
    } catch (error) {
      setPeople((current) => current.map((entry) =>
        entry.stableId === person.stableId ? { ...entry, actioned: previous } : entry));
      announce({ message: error instanceof Error ? error.message : "couldn't save that." });
    }
  }

  async function setDismissed(
    person: LinkedInOutreachPerson,
    value: boolean,
    allowUndo = true,
  ) {
    const previous = person.dismissed;
    setPeople((current) => current.map((entry) =>
      entry.stableId === person.stableId ? { ...entry, dismissed: value } : entry));
    try {
      await postMutation("dismiss", { id: person.stableId, dismissed: value });
      announce({
        message: value ? "nah. filed away." : "restored to the pile.",
        undo: allowUndo ? () => void setDismissed(person, previous, false) : undefined,
      });
    } catch (error) {
      setPeople((current) => current.map((entry) =>
        entry.stableId === person.stableId ? { ...entry, dismissed: previous } : entry));
      announce({ message: error instanceof Error ? error.message : "couldn't save that." });
    }
  }

  async function copyNote(note: string) {
    try {
      await navigator.clipboard.writeText(note);
      announce({ message: "note copied. go be charming." });
    } catch {
      announce({ message: "clipboard said nope — select the note manually." });
    }
  }

  return (
    <div className="li-page" data-lane={lane} data-ready={ready}>
      <a className="li-back" href="/">← stanwood.dev</a>

      <header className="li-masthead">
        <div className="li-title-wrap">
          <span className="li-title" aria-hidden="true">LI</span>
          <div>
            <h1>the people pile</h1>
            <p>knock it down, one human at a time.</p>
          </div>
        </div>
        <div className="li-rule-sticker">manual clicks only ✋</div>
      </header>

      <section className="li-scoreboard" aria-label="Overall progress">
        <div className="li-score-main">
          <span>left in the pile</span>
          <strong>{summary.remaining}</strong>
        </div>
        <div className="li-score-side">
          <div><strong>{summary.reviewed}</strong><span>reviewed</span></div>
          <div><strong>{summary.actioned}</strong><span>done</span></div>
          <div><strong>{summary.dismissed}</strong><span>nah</span></div>
        </div>
        <div className="li-progress" aria-label={`${laneProgress}% of ${lane} lane reviewed`}>
          <div style={{ width: `${laneProgress}%` }} />
          <span>{laneProgress}% through this lane</span>
        </div>
      </section>

      <div className="li-lanes" role="tablist" aria-label="Outreach action">
        <button
          type="button"
          role="tab"
          aria-selected={lane === "connect"}
          className="li-lane li-lane--connect"
          onClick={() => resetLane("connect")}
        >
          <span className="li-lane-emoji" aria-hidden="true">👋</span>
          <span><strong>connect</strong><small>people you've actually met</small></span>
          <b>{summary.connects}</b>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={lane === "follow"}
          className="li-lane li-lane--follow"
          onClick={() => resetLane("follow")}
        >
          <span className="li-lane-emoji" aria-hidden="true">👀</span>
          <span><strong>follow</strong><small>people you haven't met</small></span>
          <b>{summary.follows}</b>
        </button>
      </div>

      <div className="li-lane-rule">
        {lane === "connect"
          ? "invite lane — warmest batches first, then A → B → C inside each batch."
          : "follow-only lane — do not burn a connection request on these people."}
      </div>

      <section className="li-controls" aria-label="Queue filters">
        <label className="li-search">
          <span>find somebody</span>
          <input
            type="search"
            value={query}
            placeholder="name, org, or reason"
            onChange={(event) => { setQuery(event.target.value); setVisibleLimit(100); }}
          />
        </label>
        {lane === "connect" && (
          <label>
            <span>batch</span>
            <select value={batch} onChange={(event) => { setBatch(event.target.value); setVisibleLimit(100); }}>
              <option value="current">current · {currentBatch ?? "—"}</option>
              <option value="all">all batches</option>
              {Array.from({ length: 11 }, (_, index) => index + 1).map((number) => (
                <option value={number} key={number}>batch {number}</option>
              ))}
            </select>
          </label>
        )}
        {lane === "connect" && (
          <label>
            <span>tier</span>
            <select value={tier} onChange={(event) => { setTier(event.target.value); setVisibleLimit(100); }}>
              <option value="all">all tiers</option>
              <option value="A">A · highest</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
        )}
        <label>
          <span>category</span>
          <select value={category} onChange={(event) => { setCategory(event.target.value); setVisibleLimit(100); }}>
            <option value="all">all categories</option>
            {categories.map(([key, value]) => (
              <option value={key} key={key}>{titleCase(value.label)} · {value.count}</option>
            ))}
          </select>
        </label>
        <label>
          <span>status</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value as QueueStatus); setVisibleLimit(100); }}>
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
        {lane === "connect" && (
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
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
          {filtered.length > visible.length ? ` · showing ${visible.length}` : ""}
        </div>
      </div>

      <div className="li-results" id="tracker-results">
        {visible.length === 0 ? (
          <div className="li-empty">
            <strong>nothing here. weirdly satisfying.</strong>
            <span>try another filter or switch piles.</span>
          </div>
        ) : grouped.map(([label, entries]) => {
          const allInGroup = view === "priority"
            ? filtered
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
  return (
    <li
      className={`li-person${person.actioned ? " is-done" : ""}${person.dismissed ? " is-dismissed" : ""}`}
      data-id={person.stableId}
    >
      <label className="li-done">
        <input
          type="checkbox"
          checked={person.actioned}
          disabled={person.dismissed}
          aria-label={`Mark ${person.name} actioned`}
          onChange={(event) => onActioned(event.target.checked)}
        />
        <span aria-hidden="true">✓</span>
      </label>

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
          <span>{person.kind === "connect" ? `source: ${person.source}` : `source order: ${person.sourceOrder}`}</span>
          {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
          {person.kind === "follow" && !person.profileUrlFound && (
            <span>name search · no guessed profile</span>
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
        <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer">
          {person.kind === "connect" ? "open to connect ↗" : "open to follow ↗"}
        </a>
        {person.dismissed ? (
          <button type="button" className="restore" onClick={() => onDismissed(false)}>restore</button>
        ) : (
          <button
            type="button"
            className="nah"
            aria-label={`Dismiss ${person.name}`}
            onClick={() => onDismissed(true)}
          >nah</button>
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
