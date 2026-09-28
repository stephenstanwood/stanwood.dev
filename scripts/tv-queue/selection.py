"""Deterministic, quota-bounded discovery and repeat-resistant daily edits."""
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

# Ten searches per run, as before, with a different angle in each lane each day.
SEARCH_LANES = {
    "practical_ai": ['"AI coding" debugging real project -news -free', '"agent workflow" evaluation lessons -free', '"LLM" production failure case study'],
    "software_internals": ['"how browsers work" engineering', '"compiler" internals explained', '"database" internals engineering'],
    "debugging": ['"software" postmortem outage', '"debugging" hardest bug', '"software" performance investigation'],
    "systems": ['"distributed systems" engineering talk', '"database" indexing performance', '"networking" systems design tradeoffs'],
    "web_craft": ['"web accessibility" practical', '"CSS" layout deep dive', '"TypeScript" software design refactoring'],
    "design": ['"interface design" critique', '"interaction design" case study', '"user research" product lessons'],
    "product": ['"bootstrapped" customer interviews', '"solo founder" product lessons -million', '"SaaS" pricing churn experiment'],
    "visual_computing": ['"computer graphics" explained', '"algorithm" visualization', '"linear algebra" visual explanation'],
    "public_tech": ['"civic tech" project', '"open data" visualization tool', '"accessibility" design case study'],
    "working_craft": ['"code review" engineering lessons', '"prototyping" design experiment', '"open source" maintainer lessons'],
}

def discovery_searches(now):
    day = now.toordinal()
    return [(lane, queries[day % len(queries)], "relevance") for lane, queries in SEARCH_LANES.items()]

TOPICS = ["hci", "war_stories", "systems_db", "swe_craft", "algorithms", "math_viz", "civic_open", "product_craft", "solo_builder", "working_method", "applied_ai"]
AI_TITLE = re.compile(r"\b(?:AI|LLM|GPT|Claude|Codex|Gemini|Opus|Jev|OpenJevs?|agentic|agents?)\b", re.I)

def topic_key(video):
    # The title leads. Incidental words in a channel's boilerplate must not let
    # an AI setup video evade the AI cap by masquerading as design or SaaS.
    if AI_TITLE.search(video.get("title", "")) or "applied_ai" in video.get("title_categories", []):
        return "applied_ai"
    categories = video.get("title_categories", [])
    return next((t for t in TOPICS if t in categories), "working_method")

STOP = set("the a an to of in on for with and or how why what is are was i my your this that it we you from new build use using".split())
def title_tokens(title):
    return {s for s in re.findall(r"[a-z0-9]+", title.lower()) if s not in STOP and len(s) > 2}

def similar(a, b):
    aa, bb = title_tokens(a), title_tokens(b)
    return bool(aa and bb) and len(aa & bb) / min(len(aa), len(bb)) >= 0.7

def load_history(path):
    try:
        value = json.loads(path.read_text())
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError):
        return {}

def choose_edit(videos, history, now, count=20):
    today = now.date().isoformat()
    cutoff = (now - timedelta(days=7)).date().isoformat()
    recent = [edition for date, edition in history.items() if cutoff <= date < today]
    exposures = {}
    channels = {}
    for edition in recent:
        for item in edition:
            exposures[item["id"]] = exposures.get(item["id"], 0) + 1
            channels[item["channel"]] = channels.get(item["channel"], 0) + 1
    eligible = [v for v in videos if exposures.get(v["id"], 0) < 3]
    def rank(v):
        return (v.get("rank_score", 0) - exposures.get(v["id"], 0) * 8
                - min(channels.get(v["channel_id"], 0), 5) * 1.5)
    ranked = sorted(eligible, key=lambda v: (-rank(v), v["id"]))
    selected, source_set, topic_counts = [], set(), {}
    for video in ranked:
        topic = topic_key(video)
        if video["channel_id"] in source_set or topic_counts.get(topic, 0) >= 3:
            continue
        if any(similar(video["title"], other["title"]) for other in selected):
            continue
        selected.append(video)
        source_set.add(video["channel_id"])
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
        if len(selected) == count:
            break
    ids = {v["id"] for v in selected}
    # Spread the strongest topics across the first row instead of front-loading
    # three AI videos simply because all three have high editorial scores.
    ordered, cycle = [], set()
    while selected:
        index = next((i for i, v in enumerate(selected) if topic_key(v) not in cycle), None)
        if index is None:
            cycle.clear()
            continue
        video = selected.pop(index)
        ordered.append(video)
        cycle.add(topic_key(video))
    return ordered, [v for v in ranked if v["id"] not in ids]

def save_history(path, history, queue, now):
    cutoff = (now - timedelta(days=14)).date().isoformat()
    history = {date: items for date, items in history.items() if date >= cutoff}
    # Idempotent same-day reruns don't count as extra impressions.
    history[now.date().isoformat()] = [{"id": v["id"], "channel": v["channel_id"]} for v in queue]
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(history, indent=2))
    temp.replace(path)
