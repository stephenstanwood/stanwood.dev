"""Deterministic, quota-bounded discovery and repeat-resistant daily edits."""
import json
import re
from datetime import timedelta

# Ten searches per run (one per lane), each lane rotating through three angles.
# The lanes span the whole interest map so no single genre can take over the
# edit. Angles are specific and mostly relevance-ordered: in dry runs, broad
# viewCount searches ("I built", "what happened to") returned mainstream
# entertainment, while specific phrasings found the niche gems.
SEARCH_LANES = {
    "practical_ai": [
        ('"Claude Code"|"Codex" real project lessons -course -tutorial -beginner', "relevance"),
        ('"coding agents" what I learned shipping -course -beginner', "relevance"),
        ('"AI agent" incident|failure|postmortem explained', "relevance"),
    ],
    "dev_world": [
        ('"open source" drama explained', "relevance"),
        ('"why developers" hate|love|left', "relevance"),
        ('"web development" news this week', "relevance"),
    ],
    "war_stories": [
        ('hack breach explained how it happened', "viewCount"),
        ('"took down" internet|outage explained', "relevance"),
        ('database deleted|disaster engineering story', "relevance"),
    ],
    "how_it_works": [
        ('"from scratch" built my own', "relevance"),
        ('"under the hood" how it actually works software', "relevance"),
        ('how browsers|compilers|databases|CPUs actually work', "relevance"),
    ],
    "design": [
        ('"interface design" details critique', "relevance"),
        ('"app UI" breakdown|teardown design', "relevance"),
        ('"UX review"|"UX design of" app|game', "relevance"),
    ],
    "product": [
        ('"indie hacker"|"solo founder" launched app lessons -course', "relevance"),
        ('software company strategy "case study"|"business breakdown"', "relevance"),
        ('startup "shut down"|"post-mortem" founder lessons', "relevance"),
    ],
    "visual_computing": [
        ('"graphics programming"|"rendering" explained deep dive', "relevance"),
        ('"procedural generation"|"ray tracing"|"pixel art" programming', "relevance"),
        ('"data visualization" story|explained|interactive', "relevance"),
    ],
    "tech_history": [
        ('"the story of" software|programming|computer', "relevance"),
        ('"history of" programming|software|computing', "relevance"),
        ('"rise and fall" tech company|software', "relevance"),
    ],
    "public_tech": [
        ('"civic tech"|"government technology"|"gov tech" project', "relevance"),
        ('"web accessibility" audit|"screen reader"', "relevance"),
        ('"open data" visualization|map project', "relevance"),
    ],
    "making": [
        ('"I built"|"I made" my own computer|robot|keyboard|app', "relevance"),
        ('homelab|"self-hosted" setup tour', "relevance"),
        ('"own game engine"|"my own engine" programming devlog', "relevance"),
    ],
}


def discovery_searches(now):
    day = now.toordinal()
    out = []
    for lane, angles in SEARCH_LANES.items():
        query, order = angles[day % len(angles)]
        out.append((lane, query, order))
    return out


# The editor files every video under one of these. Labels render as card chips.
TOPICS = {
    "ai_practice": "AI in practice",
    "dev_world": "dev world",
    "war_stories": "war stories",
    "how_it_works": "how it works",
    "software_craft": "software craft",
    "design": "design",
    "product": "product & startups",
    "visual_computing": "visual computing",
    "tech_history": "tech history",
    "public_tech": "public tech",
    "making": "builds",
}
# Keyword categories from build_broader.py, used only when the editor gave no topic.
LEGACY_TOPICS = {
    "applied_ai": "ai_practice", "hci": "design", "war_stories": "war_stories",
    "systems_db": "how_it_works", "swe_craft": "software_craft", "algorithms": "how_it_works",
    "math_viz": "visual_computing", "civic_open": "public_tech", "product_craft": "product",
    "solo_builder": "product", "working_method": "software_craft", "dev_culture": "dev_world",
    "explainers": "how_it_works", "tech_history": "tech_history", "creative_code": "visual_computing",
    "making": "making",
}
DEFAULT_TOPIC = "software_craft"
TOPIC_CAP = 3
TOPIC_CAPS = {"ai_practice": 4}
LONG_SECONDS = 60 * 60
LONG_CAP = 3            # hour-plus videos in one edit
EXPOSURE_LIMIT = 3      # appearances in the prior seven editions
AI_TITLE = re.compile(r"\b(?:AI|LLM|GPT|Claude|Codex|Gemini|Opus|Jev|OpenJevs?|agentic|agents?)\b", re.I)


def topic_key(video):
    # The title leads. Incidental words in a channel's boilerplate must not let
    # an AI setup video evade the AI cap by masquerading as design or SaaS.
    if AI_TITLE.search(video.get("title", "")):
        return "ai_practice"
    topic = video.get("topic") or ""
    topic = LEGACY_TOPICS.get(topic, topic)
    if topic in TOPICS:
        return topic
    for category in video.get("title_categories", []):
        if category in LEGACY_TOPICS:
            return LEGACY_TOPICS[category]
    return DEFAULT_TOPIC


def theme_key(video):
    """Normalized editor theme ("Code Review" == "code-review"); '' when absent."""
    return " ".join(re.findall(r"[a-z0-9+#]+", str(video.get("theme") or "").lower()))


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


def can_add(video, selected):
    """Hard diversity caps shared by the nightly edit and the page's refills."""
    topic = topic_key(video)
    if sum(1 for v in selected if topic_key(v) == topic) >= TOPIC_CAPS.get(topic, TOPIC_CAP):
        return False
    if any(v["channel_id"] == video["channel_id"] for v in selected):
        return False
    theme = theme_key(video)
    if theme and any(theme_key(v) == theme for v in selected):
        return False
    if any(similar(video["title"], v["title"]) for v in selected):
        return False
    if video.get("duration", 0) >= LONG_SECONDS:
        if sum(1 for v in selected if v.get("duration", 0) >= LONG_SECONDS) >= LONG_CAP:
            return False
    return True


def choose_edit(videos, history, now, count=20, floor=0):
    """Pick the visible edit; everything else eligible becomes the ranked reserve.

    `floor` is the minimum editorial score for the visible edit. Reserve items
    only need to be in `videos` (the caller applies the reserve floor).
    """
    today = now.date().isoformat()
    cutoff = (now - timedelta(days=7)).date().isoformat()
    recent = [edition for date, edition in history.items() if cutoff <= date < today]
    exposures = {}
    channels = {}
    for edition in recent:
        for item in edition:
            exposures[item["id"]] = exposures.get(item["id"], 0) + 1
            channels[item["channel"]] = channels.get(item["channel"], 0) + 1
    eligible = [v for v in videos if exposures.get(v["id"], 0) < EXPOSURE_LIMIT]
    def rank(v):
        return (v.get("rank_score", 0) - exposures.get(v["id"], 0) * 8
                - min(channels.get(v["channel_id"], 0), 5) * 1.5)
    ranked = sorted(eligible, key=lambda v: (-rank(v), v["id"]))
    selected = []
    for video in ranked:
        if video.get("editorial_score", floor) < floor or not can_add(video, selected):
            continue
        selected.append(video)
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
