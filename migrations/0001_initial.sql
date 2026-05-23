-- Party members
CREATE TABLE IF NOT EXISTS party_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ac INTEGER NOT NULL DEFAULT 10,
  max_hp INTEGER NOT NULL DEFAULT 10,
  current_hp INTEGER NOT NULL DEFAULT 10,
  level INTEGER NOT NULL DEFAULT 1,
  passive_perception INTEGER NOT NULL DEFAULT 10,
  portrait_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Custom enemies
CREATE TABLE IF NOT EXISTS enemies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_hp INTEGER NOT NULL DEFAULT 10,
  ac INTEGER NOT NULL DEFAULT 10,
  abilities TEXT,
  source TEXT NOT NULL DEFAULT 'custom',
  srd_slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Encounter templates
CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Encounter entries (which enemies, how many)
CREATE TABLE IF NOT EXISTS encounter_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encounter_id TEXT NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  enemy_id TEXT NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_encounter_entries_encounter ON encounter_entries(encounter_id);

-- Active combat state (single row, JSON blob for simplicity)
CREATE TABLE IF NOT EXISTS combat_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App settings (single row per user; no auth yet so just one row)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  settings_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
