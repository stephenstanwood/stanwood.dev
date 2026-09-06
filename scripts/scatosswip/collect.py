#!/usr/bin/env python3
"""School-first personal listing collector. Public sources only; no paid APIs.

MLS discovery starts inside LGSUHSD. The exact, current LGHS polygon is the
first eligibility check; city, price and room counts follow it. Full listing
details and K-8 lookups are only enriched for surviving homes. Keep receipts
outside the repository. Publishing is a separate, atomic database transaction.
"""
import argparse
import hashlib
import html
import json
import math
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

AGENT = 'ScatosSwip/1.0 (+https://stanwood.dev/lg; personal home search)'
MLS = 'https://www.mlslistings.com'
GOREAL = 'https://letsgoreal.com'
HIGH = 'https://los-gatos-saratoga-union-high.schoolexplorerapp.com'
ELEMENTARY = 'https://www.schoolsitelocator.com/server/rest/services/ssl_IM/MapServer/254/query'
ELEMENTARY_PAGE = 'https://www.schoolsitelocator.com/apps/losgatos/'
DISTRICT = 'Los Gatos-Saratoga Joint Union High'
MAX_PRICE = 4_000_000
NOW = datetime.now(timezone.utc).isoformat()


def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', str(value)))).strip()


def number(value):
    try:
        return float(str(value).replace(',', '').replace('$', ''))
    except (TypeError, ValueError):
        return None


def normalized_address(value):
    value = re.sub(r'[^a-z0-9 ]', '', value.lower())
    for full, short in [('avenue', 'ave'), ('street', 'st'), ('drive', 'dr'), ('lane', 'ln'),
                        ('road', 'rd'), ('court', 'ct'), ('circle', 'cir'), ('boulevard', 'blvd'),
                        ('terrace', 'ter'), ('place', 'pl'), ('way', 'wy'), ('highway', 'hwy'),
                        ('south', 's'), ('north', 'n'), ('east', 'e'), ('west', 'w')]:
        value = re.sub(r'\b' + full + r'\b', short, value)
    return re.sub(r'\s+', ' ', value).strip()


class PublicClient:
    def __init__(self, receipt_dir):
        self.receipt_dir = receipt_dir
        self.robots = {}
        self.last_request = {}

    def raw(self, url, data=None):
        host = urllib.parse.urlsplit(url).netloc
        time.sleep(max(0, .55 - (time.monotonic() - self.last_request.get(host, 0))))
        self.last_request[host] = time.monotonic()
        headers = {'User-Agent': AGENT}
        if data is not None:
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
        request = urllib.request.Request(url, data=data, headers=headers)
        # TLS verification is intentionally never disabled; no challenge bypasses.
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read(12_000_000).decode('utf-8-sig')
            return body, response.geturl()

    def get(self, url, label=None, data=None):
        parts = urllib.parse.urlsplit(url)
        origin = parts.scheme + '://' + parts.netloc
        if origin not in self.robots:
            parser = urllib.robotparser.RobotFileParser()
            try:
                robots, _ = self.raw(origin + '/robots.txt')
                parser.parse(robots.splitlines())
            except urllib.error.HTTPError as error:
                if error.code not in (404, 410):
                    raise
                parser.parse(['User-agent: *', 'Allow: /'])
            self.robots[origin] = parser
        parser = self.robots[origin]
        if not parser.can_fetch(AGENT, url):
            raise RuntimeError('robots.txt disallows ' + url)
        delay = parser.crawl_delay(AGENT) or 0
        if delay:
            time.sleep(max(0, delay - (time.monotonic() - self.last_request.get(parts.netloc, 0))))
        body, final_url = self.raw(url, data)
        if label:
            (self.receipt_dir / (label + '.txt')).write_text(body)
        return body, final_url

    def json(self, url, label=None):
        return json.loads(self.get(url, label)[0])


def geometry_features(value):
    if isinstance(value, dict):
        if value.get('type') == 'Feature' and value.get('geometry'):
            yield value
        for key, item in value.items():
            if key not in ('geometry', 'coordinates'):
                yield from geometry_features(item)
    elif isinstance(value, list):
        for item in value:
            yield from geometry_features(item)


def in_ring(point, ring):
    x, y = point
    inside = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > y) != (b[1] > y):
            if x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
                inside = not inside
    return inside


def in_geometry(point, geometry):
    if not all(isinstance(x, (int, float)) and math.isfinite(x) for x in point):
        return False
    if geometry.get('type') == 'Polygon':
        polygons = [geometry['coordinates']]
    elif geometry.get('type') == 'MultiPolygon':
        polygons = geometry['coordinates']
    else:
        raise ValueError('Expected official polygon geometry')
    return any(in_ring(point, poly[0]) and not any(in_ring(point, hole) for hole in poly[1:])
               for poly in polygons if poly)


def parse_goreal(body):
    chunks = []
    for script in re.findall(r'<script[^>]*>(.*?)</script>', body, re.S):
        match = re.search(r'self\.__next_f\.push\((.*)\)', script, re.S)
        if match:
            try:
                chunk = json.loads(match.group(1))
                if len(chunk) > 1 and isinstance(chunk[1], str):
                    chunks.append(chunk[1])
            except (ValueError, TypeError):
                continue
    flight = ''.join(chunks)
    match = re.search(r'"initialData":', flight)
    if not match:
        raise ValueError('GoReal listing payload missing')
    payload = json.JSONDecoder().raw_decode(flight[match.end():])[0]
    if not isinstance(payload.get('listings'), list) or not isinstance(payload.get('total'), int):
        raise ValueError('GoReal listing payload changed')
    links = [html.unescape(url) for url in re.findall(r'href="([^"]+)"', body)]
    for row in payload['listings']:
        row['sourceUrl'] = next((urllib.parse.urljoin(GOREAL, url) for url in links
                                 if url.startswith('/homes/los-gatos/') and url.endswith('/mls-' + str(row['mlsListingId']))),
                                GOREAL + '/homes/los-gatos')
    return payload


def parse_mls_index(body):
    cards = []
    headings = list(re.finditer(r'<h5[^>]*listing-address[^>]*>(.*?)</h5>', body, re.S))
    for index, heading in enumerate(headings):
        link = re.search(r'href="([^"]+)"', heading.group(1))
        if not link:
            continue
        address = clean(heading.group(1))
        # District search can contain Saratoga; this is geographic narrowing,
        # not an inference of high-school assignment.
        if not re.search(r',\s*Los Gatos,\s*CA\b', address, re.I):
            continue
        end = headings[index + 1].start() if index + 1 < len(headings) else heading.end() + 9000
        segment = body[heading.end():end]
        property_match = re.search(r'<div[^>]*listing-type[^>]*>(.*?)</div>', segment, re.S)
        if property_match and clean(property_match.group(1)) != 'Single Family Residence':
            continue
        cards.append({'url': urllib.parse.urljoin(MLS, html.unescape(link.group(1))),
                      'address': address.split(',')[0], 'text': clean(segment)})
    if not headings:
        raise ValueError('MLS search cards missing; refusing an empty refresh')
    pages = sorted(set(html.unescape(url) for url in re.findall(r'href="([^"]+)"', body)
                       if '/Search/Result/' in url and 'criteria=' in url and 'view=list' in url))
    return cards, pages


def fetch_mls_index(client, url, label, data=None):
    # The public search occasionally serves a normal empty-results shell for a
    # populated page. Retry it once, slowly; never treat that as a complete feed.
    for attempt in range(2):
        body, final_url = client.get(url, label + ('-retry' if attempt else ''), data=data)
        try:
            cards, pages = parse_mls_index(body)
            return cards, pages, body, final_url
        except ValueError:
            if attempt:
                raise
            time.sleep(4)
    raise ValueError('MLS index could not be checked')


def parse_mls(body, url):
    metadata_match = re.search(r'<pre[^>]*>\s*---(.*?)---\s*</pre>', body, re.S)
    if not metadata_match:
        raise ValueError('MLS structured metadata missing')
    metadata = {}
    for line in metadata_match.group(1).splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            metadata[key.strip()] = html.unescape(value.strip().strip('"'))
    json_match = re.search(r'<script[^>]*type="application/ld(?:\+|&#x2B;)json"[^>]*>(.*?)</script>', body, re.S | re.I)
    schema = json.loads(json_match.group(1)) if json_match else {}
    remarks = re.search(r'<!-- llm:section=remarks -->(.*?)<!-- /llm:section -->', body, re.S)
    remarks = clean(remarks.group(1)).removeprefix('Remarks ').strip() if remarks else ''
    baths = (number(metadata.get('baths_full')) or 0) + .5 * (number(metadata.get('baths_half')) or 0)
    opens = []
    section = re.search(r'<!-- llm:section=open-houses -->(.*?)<!-- /llm:section -->', body, re.S)
    if section:
        for row in re.findall(r'<tr>(.*?)</tr>', section.group(1), re.S):
            values = [clean(v) for v in re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)]
            if len(values) >= 2:
                opens.append({'dateLabel': values[0], 'timeLabel': values[1]})
    return {
        'id': metadata.get('listing_id', '').upper(),
        'address': metadata.get('address'), 'city': metadata.get('city'), 'zip': metadata.get('zip'),
        'price': number(metadata.get('price')), 'beds': number(metadata.get('beds')), 'baths': baths,
        'sqft': number(metadata.get('sqft_living')), 'lotSqft': number(metadata.get('sqft_lot')),
        'yearBuilt': number(metadata.get('year_built')), 'status': metadata.get('status'),
        'propertyType': metadata.get('property_subtype'),
        'lat': number(metadata.get('lat')), 'lng': number(metadata.get('lng')),
        'listedAt': schema.get('datePosted'), 'daysOnMarket': number(metadata.get('days_on_market')),
        'photos': [p for p in schema.get('image', []) if isinstance(p, str) and p.startswith('https://')][:35],
        'office': metadata.get('list_office'), 'agent': metadata.get('list_agent'),
        'url': url.split('?')[0], 'remarks': remarks, 'openHouses': opens,
    }


def feature_summary(remarks):
    lower = remarks.lower()
    features = []
    if re.search(r'\b(lawn|turf|grass|play\s*(?:area|structure)|level (?:back)?yard|flat (?:back)?yard)\b', lower):
        yard = 'Lawn or play area mentioned'
    elif re.search(r'\b(backyard|back yard|rear yard|yard)\b', lower):
        yard = 'Yard mentioned in listing'
    else:
        yard = 'Yard needs a closer look'
    for pattern, label in [
        (r'\b(?:office|study)\b', 'Office space mentioned'),
        (r'\b(?:adu|guest house|guest cottage)\b', 'Guest space mentioned'),
        (r'\b(?:pool|swimming)\b', 'Pool mentioned'),
        (r'\b(?:solar)\b', 'Solar mentioned'),
        (r'\b(?:single.story|single.level|one.story)\b', 'Single level mentioned'),
    ]:
        if re.search(pattern, lower):
            features.append(label)
    walk = bool(re.search(r'(?:walk|stroll|steps).{0,65}(?:downtown|town center|town centre)|(?:downtown).{0,40}(?:walk|stroll)', lower))
    return yard, features, walk


def miles_to_town(lat, lng):
    # Town Plaza, not an invented route duration. UI labels this straight-line.
    r = math.pi / 180
    dy, dx = (37.2228 - lat) * r, (-121.9843 - lng) * r
    a = math.sin(dy / 2) ** 2 + math.cos(lat * r) * math.cos(37.2228 * r) * math.sin(dx / 2) ** 2
    return round(3958.8 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def assigned_names(result):
    return sorted(set(feature.get('properties', {}).get('name', '')
                      for feature in geometry_features(result)))


def collect(output, receipts):
    receipts.mkdir(parents=True, exist_ok=True)
    client = PublicClient(receipts)
    # Load the mandatory boundary BEFORE any listing discovery.
    layers = client.json(HIGH + '/GeoData/LayerStructure', 'official-high-school-boundaries')
    matches = [f for f in geometry_features(layers) if f.get('properties', {}).get('name') == 'Los Gatos High School']
    if len(matches) != 1:
        raise ValueError('Exactly one official Los Gatos High boundary is required')
    boundary = matches[0]['geometry']
    boundary_hash = hashlib.sha256(json.dumps(boundary, sort_keys=True).encode()).hexdigest()
    print('Loaded official Los Gatos High attendance boundary.', flush=True)
    coverage = []
    errors = []
    goreal = {}
    try:
        first = parse_goreal(client.get(GOREAL + '/homes?cities=los-gatos', 'goreal-0')[0])
        all_rows = first['listings'][:]
        for page in range(1, min(20, math.ceil(first['total'] / first['perPage']))):
            payload = parse_goreal(client.get(GOREAL + '/homes?cities=los-gatos&page=' + str(page), 'goreal-' + str(page))[0])
            all_rows += payload['listings']
        unique = {row['id']: row for row in all_rows}
        if len(unique) < first['total']:
            raise ValueError(f'Incomplete pagination: {len(unique)} of {first["total"]}')
        goreal = {normalized_address(row['address']): row for row in unique.values()}
        coverage.append({'name': 'GoReal', 'url': GOREAL + '/homes/los-gatos', 'status': 'ok', 'count': len(goreal)})
    except Exception as error:
        errors.append('GoReal: ' + str(error))
        coverage.append({'name': 'GoReal', 'url': GOREAL + '/homes/los-gatos', 'status': 'unavailable'})
    # Use MLS's own high-school-district search, rather than crawling citywide.
    cards, pages, body, index_url = fetch_mls_index(client, MLS + '/Search/ResultPost', 'mls-district-1', data=urllib.parse.urlencode({
        'searchText': DISTRICT, 'searchTextType': 'HighSchoolDistrict', 'transactionType': 'buy',
    }).encode())
    if 'los-gatos-saratoga-joint-union-high' not in index_url.lower():
        raise ValueError('MLS did not honor the district search')
    last_match = re.search(r'<a[^>]*aria-label="Last"[^>]*href="([^"]+)"', body)
    last_page = int(re.search(r'/(\d+)\?', last_match.group(1)).group(1)) if last_match else 1
    visited = {urllib.parse.urlparse(index_url).path}
    queue = pages[:]
    while queue:
        path = queue.pop(0)
        key = urllib.parse.urlparse(path).path
        page_match = re.search(r'/(\d+)$', key)
        if key in visited or not page_match or not 1 <= int(page_match.group(1)) <= last_page:
            continue
        if len(visited) >= 20:
            raise ValueError('MLS pagination exceeded expected bound')
        visited.add(key)
        more, more_pages, _, _ = fetch_mls_index(client, urllib.parse.urljoin(MLS, path), 'mls-district-' + page_match.group(1))
        cards += more
        queue += [p for p in more_pages if urllib.parse.urlparse(p).path not in visited]
    if len(visited) != last_page:
        raise ValueError(f'Incomplete MLS pagination: {len(visited)} of {last_page}')
    cards = {card['url'].lower(): card for card in cards}
    coverage.insert(0, {'name': 'MLSListings', 'url': index_url, 'status': 'ok', 'count': len(cards)})
    print(f'District-filtered MLS index: {len(cards)} Los Gatos addresses; secondary index: {len(goreal)}.', flush=True)
    # The secondary index supplies coordinates so exact-school rejection occurs
    # without opening individual listing pages wherever possible.
    survivors = []
    excluded_school = 0
    excluded_preferences = 0
    seen_addresses = set()
    for card in cards.values():
        key = normalized_address(card['address'])
        secondary = goreal.get(key)
        if secondary:
            point = [secondary.get('longitude'), secondary.get('latitude')]
            if not in_geometry(point, boundary):
                excluded_school += 1
                continue
            # Exact school boundary has already passed; preferences come next.
            if (secondary.get('price', MAX_PRICE + 1) > MAX_PRICE or secondary.get('beds', 0) < 4
                    or secondary.get('baths', 0) < 2 or secondary.get('propertyType') != 'single_family'):
                excluded_preferences += 1
                continue
        try:
            listing = parse_mls(client.get(card['url'] + '?view=md', 'listing-' + card['url'].split('/property/')[1].split('/')[0])[0], card['url'])
            if not in_geometry([listing['lng'], listing['lat']], boundary):
                excluded_school += 1
                continue
            if (listing['city'] != 'Los Gatos' or listing['status'] != 'Active'
                    or listing['propertyType'] != 'Single Family Residence'
                    or not listing['price'] or listing['price'] > MAX_PRICE
                    or (listing['beds'] or 0) < 4 or listing['baths'] < 2):
                excluded_preferences += 1
                continue
            # Confirm the point with the district's own analysis endpoint too.
            high_url = HIGH + '/GeoData/AnalyzeLocation?' + urllib.parse.urlencode({
                'latitude': listing['lat'], 'longitude': listing['lng'], 'source': 'external'})
            result = client.json(high_url, 'school-' + listing['id'])
            if not isinstance(result.get('inDistrict'), bool):
                raise ValueError('Official high-school analysis payload changed')
            if result.get('inDistrict') is not True or assigned_names(result) != ['Los Gatos High School']:
                excluded_school += 1
                continue
            schools = {'high': 'Los Gatos High School', 'verifiedAt': NOW, 'highSource': high_url,
                       'boundaryHash': boundary_hash, 'elementary': None, 'middle': None,
                       'elementarySource': ELEMENTARY_PAGE}
            try:
                elem_url = ELEMENTARY + '?' + urllib.parse.urlencode({
                    'f': 'json', 'geometry': f'{listing["lng"]},{listing["lat"]}',
                    'geometryType': 'esriGeometryPoint', 'inSR': '4326',
                    'spatialRel': 'esriSpatialRelIntersects', 'outFields': 'ELEM_DESC,MID_DESC',
                    'returnGeometry': 'false'})
                elementary = client.json(elem_url, 'elementary-' + listing['id'])
                if 'error' in elementary:
                    raise ValueError('School locator returned an error')
                for field, name in [('ELEM_DESC', 'elementary'), ('MID_DESC', 'middle')]:
                    names = {f['attributes'][field] for f in elementary.get('features', []) if f['attributes'].get(field)}
                    if len(names) == 1:
                        schools[name] = names.pop()
                schools['elementarySource'] = elem_url
            except Exception as error:
                errors.append(listing['id'] + ' K-8 lookup: ' + str(error))
            remarks = listing.pop('remarks')
            yard, features, walk = feature_summary(remarks)
            listing.update({'schools': schools, 'yard': yard, 'features': features,
                            'walkableClaim': walk, 'townMiles': miles_to_town(listing['lat'], listing['lng']),
                            'checkedAt': NOW, 'sources': [{'name': 'MLSListings', 'url': listing['url']}]})
            if secondary:
                listing['sources'].append({'name': 'GoReal', 'url': secondary['sourceUrl']})
                # Prefer machine-dated upcoming openings; never infer a year.
                listing['openHouses'] = [o for o in secondary.get('openHouses', [])
                                         if o.get('date', '')[:10] >= NOW[:10]]
            else:
                listing['openHouses'] = []  # Human-dated MLS rows lack an explicit year.
            listing['score'] = (25 if 'Van Meter' in (schools['elementary'] or '') else 0) + (15 if 'Fisher' in (schools['middle'] or '') else 0) + (12 if walk else 0) + (8 if yard.startswith('Lawn') else 4 if yard.startswith('Yard mentioned') else 0) + (6 if listing['beds'] >= 5 else 0)
            if key not in seen_addresses:
                seen_addresses.add(key)
                survivors.append(listing)
                print(f'{listing["id"]}: {listing["address"]} — school verified', flush=True)
        except Exception as error:
            errors.append(card['address'] + ': ' + str(error))
    # A source-only address is surfaced as a coverage gap, not quietly ignored.
    indexed = {normalized_address(card['address']) for card in cards.values()}
    extra = [r for key, r in goreal.items() if key not in indexed
             and in_geometry([r.get('longitude'), r.get('latitude')], boundary)
             and r.get('propertyType') == 'single_family' and r.get('beds', 0) >= 4
             and r.get('baths', 0) >= 2 and 0 < r.get('price', 0) <= MAX_PRICE]
    if extra:
        errors.append('Secondary-source eligible addresses missing from primary feed: ' + ', '.join(r['address'] for r in extra))
    survivors.sort(key=lambda row: (-row['score'], row['townMiles'], row['price']))
    if not survivors:
        raise ValueError('No verified homes; preserve the last successful feed for review')
    feed = {'version': 1, 'generatedAt': NOW, 'listings': survivors, 'sources': coverage,
            'complete': not errors, 'errors': errors, 'counts': {'districtListings': len(cards),
            'schoolExcluded': excluded_school, 'preferenceExcluded': excluded_preferences,
            'qualified': len(survivors)}, 'refresh': {'hour': 4, 'minute': 45, 'timezone': 'America/Los_Angeles'}}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(feed, indent=2) + '\n')
    temporary.replace(output)
    print(json.dumps({'qualified': len(survivors), 'complete': feed['complete'], 'errors': errors}), flush=True)
    return feed


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--receipts', type=Path, required=True)
    args = parser.parse_args()
    try:
        collect(args.output, args.receipts)
    except Exception as error:
        print('Refresh failed; last successful feed retained: ' + str(error), file=sys.stderr)
        sys.exit(1)
