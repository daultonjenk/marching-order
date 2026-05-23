-- Make roster profile fields optional so name-only entries do not need sentinel stats.
PRAGMA foreign_keys=off;

CREATE TABLE party_members_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ac INTEGER,
  max_hp INTEGER,
  current_hp INTEGER,
  level INTEGER,
  passive_perception INTEGER,
  portrait_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO party_members_new (
  id,
  name,
  ac,
  max_hp,
  current_hp,
  level,
  passive_perception,
  portrait_url,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  NULLIF(ac, 0),
  NULLIF(max_hp, 0),
  CASE WHEN max_hp > 0 THEN current_hp ELSE NULL END,
  NULLIF(level, 0),
  NULLIF(passive_perception, 0),
  portrait_url,
  created_at,
  updated_at
FROM party_members;

DROP TABLE party_members;
ALTER TABLE party_members_new RENAME TO party_members;

PRAGMA foreign_keys=on;
