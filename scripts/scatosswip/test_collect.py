import tempfile
import unittest
import urllib.error
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch
from collect import PublicClient, in_geometry, in_search_area, SEARCH_AREA, normalized_address, feature_summary, parse_mls, assigned_names, fetch_mls_index


class PublicRequestTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.receipts = Path(directory.name)
        self.client = PublicClient(self.receipts)
        self.url = 'https://example.com/homes'

    def response(self, body, url=None):
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = body.encode()
        response.geturl.return_value = url or self.url
        return response

    def http_error(self, code=503, headers=None):
        return urllib.error.HTTPError(self.url, code, 'source unavailable', headers or {}, None)

    def test_transient_robots_and_listing_outages_recover(self):
        responses = [self.http_error(), self.response('User-agent: *\nAllow: /'),
                     self.http_error(), self.response('current homes')]
        with patch('collect.urllib.request.urlopen', side_effect=responses) as request, patch('collect.time.sleep') as sleep:
            body, _ = self.client.get(self.url, 'source')
        self.assertEqual(body, 'current homes')
        self.assertEqual((self.receipts / 'source.txt').read_text(), body)
        self.assertEqual(request.call_count, 4)
        self.assertEqual([call.args[0] for call in sleep.call_args_list if call.args[0] >= 4], [4, 4])

    def test_persistent_outage_is_bounded_and_preserves_receipt(self):
        path = self.receipts / 'source.txt'
        path.write_text('last verified response')
        with patch('collect.urllib.request.urlopen', side_effect=self.http_error()) as request, patch('collect.time.sleep') as sleep:
            with self.assertRaises(urllib.error.HTTPError):
                self.client.get(self.url, 'source')
        self.assertEqual(request.call_count, 3)
        self.assertEqual(path.read_text(), 'last verified response')
        self.assertEqual([call.args[0] for call in sleep.call_args_list if call.args[0] >= 4], [4, 8])

    def test_retry_after_seconds_and_date_are_honored(self):
        now = datetime.now(timezone.utc).replace(microsecond=0)
        for header in ('13', format_datetime(now + timedelta(seconds=13))):
            with self.subTest(header=header):
                with patch('collect.datetime') as clock, patch('collect.time.sleep') as sleep, patch(
                        'collect.urllib.request.urlopen', side_effect=[self.http_error(headers={'Retry-After': header}), self.response('recovered')]):
                    clock.now.return_value = now
                    self.assertEqual(self.client.raw(self.url)[0], 'recovered')
                sleep.assert_any_call(13)

    def test_long_retry_after_defers_instead_of_retrying_early(self):
        with patch('collect.urllib.request.urlopen', side_effect=self.http_error(headers={'Retry-After': '120'})) as request, patch('collect.time.sleep') as sleep:
            with self.assertRaises(urllib.error.HTTPError):
                self.client.raw(self.url)
        self.assertEqual(request.call_count, 1)
        self.assertFalse(any(call.args[0] >= 4 for call in sleep.call_args_list))

    def test_access_denials_are_not_retried(self):
        for code in (401, 403, 429):
            with self.subTest(code=code), patch('collect.urllib.request.urlopen', side_effect=self.http_error(code)) as request, patch('collect.time.sleep'):
                with self.assertRaises(urllib.error.HTTPError):
                    self.client.raw(self.url)
                self.assertEqual(request.call_count, 1)

    def test_tls_failures_are_not_retried(self):
        with patch('collect.urllib.request.urlopen', side_effect=urllib.error.URLError('certificate verification failed')) as request, patch('collect.time.sleep'):
            with self.assertRaises(urllib.error.URLError):
                self.client.raw(self.url)
        self.assertEqual(request.call_count, 1)

    def test_robots_denial_still_prevents_source_request(self):
        with patch('collect.urllib.request.urlopen', return_value=self.response('User-agent: *\nDisallow: /homes')) as request, patch('collect.time.sleep'):
            with self.assertRaisesRegex(RuntimeError, 'robots.txt disallows'):
                self.client.get(self.url, 'source')
        self.assertEqual(request.call_count, 1)
        self.assertFalse((self.receipts / 'source.txt').exists())


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
        self.assertEqual(yard, '')
        self.assertIn('Pool mentioned', features)
        self.assertFalse(walk)
        self.assertTrue(feature_summary('A short stroll to downtown Los Gatos.')[2])

    def test_south_of_the_cats_and_mountain_zip_are_excluded(self):
        south = SEARCH_AREA['southBoundaryLatitude']
        self.assertTrue(in_search_area(south, -121.98, '95030'))
        self.assertTrue(in_search_area(south + .01, -121.98, '95032'))
        self.assertFalse(in_search_area(south - .000001, -121.98, '95030'))
        self.assertFalse(in_search_area(south + .04, -122.12, '95033'))
        self.assertFalse(in_search_area(south + .01, -121.98, None))
        for lat, lng in [(None, -121.98), (float('nan'), -121.98), (37.23, None),
                         (37.23, float('inf')), (91, -121.98), (37.23, -181)]:
            self.assertFalse(in_search_area(lat, lng, '95032'))

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
