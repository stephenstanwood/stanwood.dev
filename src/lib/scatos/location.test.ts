import { describe, expect, it } from 'vitest';
import searchArea from '../../../scripts/scatosswip/search-area.json';
import { homeListingLinks, homeMapLinks, isInSearchArea } from './location';

describe('household location boundary', () => {
  const home = { lat: searchArea.southBoundaryLatitude, lng: -121.98, zip: '95030' };
  it('includes the cutoff and town side, excluding homes immediately south', () => {
    expect(isInSearchArea(home)).toBe(true);
    expect(isInSearchArea({ ...home, lat: home.lat + .01, zip: '95032' })).toBe(true);
    expect(isInSearchArea({ ...home, lat: home.lat - .000001 })).toBe(false);
  });
  it('excludes western mountain addresses and invalid coordinates', () => {
    expect(isInSearchArea({ ...home, lat: 37.25, lng: -122.12, zip: '95033' })).toBe(false);
    for (const change of [{ lat: NaN }, { lat: 91 }, { lng: Infinity }, { lng: -181 }]) {
      expect(isInSearchArea({ ...home, ...change })).toBe(false);
    }
  });
  it('uses the same exact coordinates for the preview and Google Maps destination', () => {
    const links = homeMapLinks(home);
    expect(new URL(links.map).searchParams.get('query')).toBe(`${home.lat},${home.lng}`);
    expect(new URL(links.embed).searchParams.get('q')).toBe(`${home.lat},${home.lng}`);
    expect(new URL(links.embed).searchParams.get('output')).toBe('embed');
  });
});

describe('property portal links', () => {
  const home = { address: '1 Main St', city: 'Los Gatos', zip: '95030' };
  it('uses verified property pages without guessing portal IDs', () => {
    const portalLinks = { redfin: 'https://www.redfin.com/CA/Los-Gatos/1-Main-St-95030/home/123',
      zillow: 'https://www.zillow.com/homedetails/1-Main-St/123_zpid/' };
    expect(homeListingLinks({ ...home, portalLinks }).map(link => link.url)).toEqual(Object.values(portalLinks));
    expect(homeListingLinks({ ...home, portalLinks }).every(link => link.direct)).toBe(true);
  });
  it('gives unresolved homes an address search and rejects foreign or unsafe URLs', () => {
    const links = homeListingLinks({ ...home, portalLinks: { redfin: 'https://www.redfin.com.evil.test/', zillow: 'javascript:alert(1)' } });
    expect(links.every(link => !link.direct)).toBe(true);
    expect(new URL(links[0].url).searchParams.get('q')).toBe('site:redfin.com "1 Main St" "Los Gatos"');
    expect(links[1].url).toContain('www.zillow.com/homes/1%20Main%20St');
  });
});
