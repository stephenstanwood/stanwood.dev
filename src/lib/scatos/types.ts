export type Profile = 'stephen' | 'madeleine';
export type Decision = 'save' | 'pass';
export interface Home {
  id: string; address: string; city: string; zip: string;
  price: number; beds: number; baths: number; sqft: number | null;
  lotSqft: number | null; yearBuilt: number | null; status: 'active' | 'archived';
  photos: string[]; office: string; agent: string; url: string;
  portalLinks?: { redfin?: string; zillow?: string };
  lat: number; lng: number; listedAt: string | null; daysOnMarket: number | null;
  yard: string; features: string[]; walkableClaim: boolean; townMiles: number;
  score: number; checkedAt: string; firstSeen: string; previousPrice?: number;
  sources: { name: string; url: string }[];
  schools: { high: string; elementary: string | null; middle: string | null;
    highSource: string; elementarySource: string; verifiedAt: string; boundaryHash: string };
  openHouses: { date: string; start_time: string; end_time: string }[];
}
export interface Choice { id: string; decision: Decision; note: string; updatedAt: string }
export interface FeedInfo {
  generatedAt: string; complete: boolean;
  sources: { name: string; url: string; status: string; count?: number }[];
  counts: { districtListings: number; schoolExcluded: number; preferenceExcluded: number; qualified: number };
  lastAttemptAt?: string; lastError?: string;
}
export interface ScatosState {
  profile: Profile; homes: Home[]; choices: Choice[]; matches: string[]; feed: FeedInfo | null;
}
