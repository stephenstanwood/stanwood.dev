import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from selection import choose_edit, discovery_searches, load_history, save_history, topic_key

NOW = datetime(2026, 9, 28, tzinfo=timezone.utc)

def video(ident, title, topic="swe_craft", channel=None, rank=80):
    return {"id": ident, "title": title, "channel_id": channel or ident,
            "title_categories": [topic], "rank_score": rank}

class SelectionTests(unittest.TestCase):
    def test_hard_caps_do_not_relax_to_fill_grid(self):
        candidates = [video(str(i), f"Distinct software topic {i}") for i in range(10)]
        queue, _ = choose_edit(candidates, {}, NOW)
        self.assertLessEqual(len(queue), 3)

    def test_one_creator_and_no_duplicate_angle(self):
        candidates = [video("a", "Refactoring concurrency safely", channel="same"),
                      video("b", "CSS grid typography", "hci", channel="same"),
                      video("c", "Refactoring concurrency safely in practice"),
                      video("d", "Database indexing internals", "systems_db")]
        queue, _ = choose_edit(candidates, {}, NOW)
        self.assertEqual([v["id"] for v in queue], ["a", "d"])

    def test_repeated_videos_cool_down_and_new_voices_rise(self):
        history = {f"2026-09-{d}": [{"id": "a", "channel": "a"}] for d in [25, 26, 27]}
        queue, pool = choose_edit([video("a", "Compiler internals", rank=99),
                                   video("b", "Fixing typography", "hci")], history, NOW)
        self.assertEqual([v["id"] for v in queue], ["b"])
        self.assertNotIn("a", [v["id"] for v in pool])

    def test_same_day_reruns_are_idempotent_and_history_expires(self):
        candidate = video("a", "Compiler internals")
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "history.json"
            save_history(path, {"2026-01-01": []}, [candidate], NOW)
            history = load_history(path)
            self.assertEqual(list(history), ["2026-09-28"])
            self.assertEqual(choose_edit([candidate], history, NOW)[0], [candidate])

    def test_ai_cannot_evade_topic_cap_with_design_or_workflow_label(self):
        for title in ["Claude for Figma", "Build with OpenJev", "GPT-6 databases"]:
            self.assertEqual(topic_key(video("a", title, "hci")), "applied_ai")

    def test_discovery_rotates_with_a_fixed_api_budget(self):
        today = discovery_searches(NOW)
        tomorrow = discovery_searches(datetime(2026, 9, 29, tzinfo=timezone.utc))
        self.assertEqual(len(today), 10)
        self.assertEqual([v[0] for v in today], [v[0] for v in tomorrow])
        self.assertTrue(all(a[1] != b[1] for a, b in zip(today, tomorrow)))

    def test_first_row_varies_even_when_ai_scores_highest(self):
        candidates = [video("a", "Claude debugging", rank=99), video("b", "GPT evaluations", rank=98),
                      video("c", "Database internals", "systems_db", rank=90),
                      video("d", "User research", "hci", rank=89)]
        queue, _ = choose_edit(candidates, {}, NOW)
        self.assertEqual([v["id"] for v in queue], ["a", "c", "d", "b"])

if __name__ == "__main__":
    unittest.main()
