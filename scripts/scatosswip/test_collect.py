import unittest
from unittest.mock import Mock, patch
from collect import in_geometry, normalized_address, feature_summary, parse_mls, assigned_names, fetch_mls_index


class SchoolFirstTests(unittest.TestCase):
    def test_boundary_holes_and_outside_points_are_excluded(self):
        shape = {'type': 'Polygon', 'coordinates': [
            [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
        ]}
        self.assertTrue(in_geometry([2, 2], shape))
        self.assertFalse(in_geometry([5, 5], shape))
        self.assertFalse(in_geometry([11, 5], shape))
        self.assertFalse(in_geometry([None, 5], shape))
        self.assertFalse(in_geometry([float('nan'), 5], shape))
        self.assertTrue(in_geometry([2, 2], {'type': 'MultiPolygon', 'coordinates': [shape['coordinates']]}))

    def test_school_assignment_is_not_district_membership_or_nearby(self):
        result = {'inDistrict': True, 'features': [{'feature': {'type': 'Feature',
                  'properties': {'name': 'Saratoga High School'}, 'geometry': {'type': 'Point', 'coordinates': [1, 1]}}}]}
        self.assertNotEqual(assigned_names(result), ['Los Gatos High School'])
        self.assertEqual(assigned_names({'inDistrict': True}), [])

    def test_source_address_variants_deduplicate(self):
        self.assertEqual(normalized_address('16497 S Kennedy Rd'), normalized_address('16497 South Kennedy Road'))
        self.assertEqual(normalized_address('20476 Santa Cruz Hwy'), normalized_address('20476 Santa Cruz Highway'))
        self.assertNotEqual(normalized_address('12 Main St'), normalized_address('112 Main St'))

    def test_lot_or_pool_is_not_usable_yard_or_walkability(self):
        yard, features, walk = feature_summary('A five acre lot. A pool. Minutes by car to downtown.')
        self.assertEqual(yard, 'Yard needs a closer look')
        self.assertIn('Pool mentioned', features)
        self.assertFalse(walk)
        self.assertTrue(feature_summary('A short stroll to downtown Los Gatos.')[2])

    def test_broken_source_is_a_failure_not_empty_inventory(self):
        with self.assertRaises(ValueError):
            parse_mls('<h1>Service temporarily unavailable</h1>', 'https://www.mlslistings.com/property/example')

    def test_transient_empty_index_is_retried_once(self):
        client = Mock()
        card = '<h5 class="listing-address"><a href="/property/example">1 Main St, Los Gatos, CA 95030</a></h5>'
        client.get.side_effect = [('<p>No matching homes</p>', 'https://example.com'), (card, 'https://example.com')]
        with patch('collect.time.sleep') as sleep:
            cards, _, _, _ = fetch_mls_index(client, 'https://example.com', 'page')
        self.assertEqual(len(cards), 1)
        self.assertEqual(client.get.call_count, 2)
        sleep.assert_called_once_with(4)

    def test_persistent_empty_index_stops_refresh(self):
        client = Mock()
        client.get.return_value = ('<p>No matching homes</p>', 'https://example.com')
        with patch('collect.time.sleep'), self.assertRaises(ValueError):
            fetch_mls_index(client, 'https://example.com', 'page')
        self.assertEqual(client.get.call_count, 2)

    def test_half_bath_is_preserved(self):
        source = '<pre>---\nlisting_id: ML12345678\nbaths_full: 2\nbaths_half: 1\n---</pre>'
        self.assertEqual(parse_mls(source, 'https://www.mlslistings.com/property/example')['baths'], 2.5)


if __name__ == '__main__':
    unittest.main()
