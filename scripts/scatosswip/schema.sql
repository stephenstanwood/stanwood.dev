CREATE SCHEMA IF NOT EXISTS scatosswip;
CREATE TABLE IF NOT EXISTS scatosswip.listings (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  previous_price numeric,
  CHECK (jsonb_typeof(data) = 'object')
);
CREATE TABLE IF NOT EXISTS scatosswip.choices (
  profile text NOT NULL CHECK (profile IN ('stephen', 'madeleine')),
  listing_id text NOT NULL REFERENCES scatosswip.listings(id),
  decision text NOT NULL CHECK (decision IN ('save', 'pass')),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile, listing_id)
);
CREATE TABLE IF NOT EXISTS scatosswip.meta (
  id text PRIMARY KEY,
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS scatosswip.price_history (
  listing_id text NOT NULL REFERENCES scatosswip.listings(id),
  price numeric NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, observed_at)
);
