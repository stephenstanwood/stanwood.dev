import searchArea from '../../../scripts/scatosswip/search-area.json';
import type { Home } from './types';

// The latitude is the pin in The Cats' own Google Maps embed. The town ZIPs
// also exclude mountain addresses west of town that sit north of the cutoff.
export function isInSearchArea(home: Pick<Home, 'lat' | 'lng' | 'zip'>): boolean {
  return Number.isFinite(home.lat) && home.lat >= searchArea.southBoundaryLatitude && home.lat <= 90
    && Number.isFinite(home.lng) && Math.abs(home.lng) <= 180
    && searchArea.allowedZipCodes.includes(home.zip);
}

export function homeMapLinks(home: Pick<Home, 'lat' | 'lng'>) {
  const point = `${home.lat},${home.lng}`;
  return {
    map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point)}`,
    embed: `https://www.google.com/maps?${new URLSearchParams({ q: point, z: '14', output: 'embed' })}`,
  };
}

export function homeListingLinks(home: Pick<Home, 'address' | 'city' | 'zip' | 'portalLinks'>) {
  const address = `${home.address}, ${home.city}, CA ${home.zip}`;
  const verified = (value: string | undefined, hostname: string) => {
    try {
      const url = new URL(value || '');
      return url.protocol === 'https:' && url.hostname === hostname ? url.href : undefined;
    } catch { return undefined; }
  };
  const redfin = verified(home.portalLinks?.redfin, 'www.redfin.com');
  const zillow = verified(home.portalLinks?.zillow, 'www.zillow.com');
  return [
    { name: 'Redfin', url: redfin || `https://www.google.com/search?${new URLSearchParams({ q: `site:redfin.com "${home.address}" "${home.city}"` })}`, direct: Boolean(redfin) },
    { name: 'Zillow', url: zillow || `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`, direct: Boolean(zillow) },
  ];
}
