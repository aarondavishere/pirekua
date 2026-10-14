CREATE TABLE qr_scans (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  country TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX qr_scans_code_scanned_at_idx ON qr_scans (code, scanned_at);
