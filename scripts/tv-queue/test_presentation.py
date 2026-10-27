import unittest
from build_broader import ad_seconds, choose_still, clean_headline, opening_skip, whole_video_ad


class PresentationTests(unittest.TestCase):
    def test_still_steers_clear_of_sponsor_reads(self):
        # 556 s video with a mid-roll sponsor at 312-348: the middle still is too close.
        self.assertEqual(choose_still(556, [[312, 348, "sponsor", "skip"]]), 1)
        self.assertEqual(choose_still(355, [[294, 355, "sponsor", "skip"]]), 2)
        self.assertEqual(choose_still(600, []), 2)

    def test_still_falls_back_to_the_middle_when_nothing_is_clear(self):
        self.assertEqual(choose_still(400, [[0, 400, "sponsor", "skip"]]), 2)

    def test_links_start_past_chained_opening_segments(self):
        segments = [[0, 12.5, "preview", "skip"], [13.4, 41, "sponsor", "skip"], [300, 330, "sponsor", "skip"]]
        self.assertEqual(opening_skip(segments, 900), 41)

    def test_no_skip_for_late_tiny_or_runaway_openings(self):
        self.assertEqual(opening_skip([[70, 74, "intro", "skip"]], 355), 0)
        self.assertEqual(opening_skip([[0, 3, "intro", "skip"]], 355), 0)
        self.assertEqual(opening_skip([[0, 200, "sponsor", "skip"]], 400), 0)
        self.assertEqual(opening_skip([[0, 30, "outro", "skip"]], 400), 0)

    def test_ad_time_merges_overlaps_and_ignores_intros(self):
        segments = [[64, 196, "sponsor", "skip"], [190, 200, "selfpromo", "skip"],
                    [0, 10, "intro", "skip"], [900, 906, "interaction", "skip"]]
        self.assertEqual(ad_seconds(segments), 142)

    def test_whole_video_ads(self):
        self.assertTrue(whole_video_ad([[0, 0, "sponsor", "full"]]))
        self.assertFalse(whole_video_ad([[0, 60, "sponsor", "skip"]]))

    def test_headline_backstop(self):
        self.assertEqual(clean_headline("  Every Adobe app,  rewritten in Rust!! "), "Every Adobe app, rewritten in Rust")
        self.assertEqual(clean_headline("What went wrong with Visual Basic..."), "What went wrong with Visual Basic")
        self.assertEqual(clean_headline("Why Postgres won?"), "Why Postgres won?")


if __name__ == "__main__":
    unittest.main()
