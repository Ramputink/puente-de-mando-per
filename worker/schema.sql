CREATE TABLE IF NOT EXISTS docs (
  path TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS docs_updated ON docs (updated);
