/** SQL pour initialiser le schéma SQLite local de l'agent mobile CNTS. */

export const DB_VERSION = 2;

export const CREATE_TABLES_SQL = `
-- Donneurs (miroir local avec metadata de sync)
CREATE TABLE IF NOT EXISTS donneurs (
  local_id       TEXT PRIMARY KEY,
  server_id      TEXT UNIQUE,
  cni_raw        TEXT,
  nom            TEXT NOT NULL,
  prenom         TEXT NOT NULL,
  sexe           TEXT NOT NULL CHECK(sexe IN ('H', 'F')),
  date_naissance TEXT,
  groupe_sanguin TEXT,
  adresse        TEXT,
  region         TEXT,
  departement    TEXT,
  telephone      TEXT,
  email          TEXT,
  profession     TEXT,
  dernier_don    TEXT,
  photo_uri      TEXT,
  sync_status    TEXT NOT NULL DEFAULT 'PENDING' CHECK(sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
  sync_error     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_donneurs_sync ON donneurs(sync_status);
CREATE INDEX IF NOT EXISTS idx_donneurs_server ON donneurs(server_id);

-- Dons
CREATE TABLE IF NOT EXISTS dons (
  local_id          TEXT PRIMARY KEY,
  server_id         TEXT UNIQUE,
  donneur_local_id  TEXT NOT NULL REFERENCES donneurs(local_id),
  donneur_server_id TEXT,
  din               TEXT UNIQUE,
  date_don          TEXT NOT NULL,
  type_don          TEXT NOT NULL,
  statut_qualification TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  idempotency_key   TEXT UNIQUE,
  sync_status       TEXT NOT NULL DEFAULT 'PENDING' CHECK(sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
  sync_error        TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dons_donneur ON dons(donneur_local_id);
CREATE INDEX IF NOT EXISTS idx_dons_sync ON dons(sync_status);

-- Rendez-vous
CREATE TABLE IF NOT EXISTS rendez_vous (
  local_id          TEXT PRIMARY KEY,
  server_id         TEXT UNIQUE,
  donneur_local_id  TEXT NOT NULL REFERENCES donneurs(local_id),
  date_prevue       TEXT NOT NULL,
  type_rdv          TEXT NOT NULL DEFAULT 'DON_SANG',
  statut            TEXT NOT NULL DEFAULT 'CONFIRME',
  lieu              TEXT,
  commentaire       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- File d'attente de synchronisation (WAL pour push)
CREATE TABLE IF NOT EXISTS event_queue (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id  TEXT NOT NULL UNIQUE,
  event_type       TEXT NOT NULL,
  payload          TEXT NOT NULL,
  occurred_at      TEXT NOT NULL DEFAULT (datetime('now')),
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PUSHING', 'ACCEPTED', 'REJECTED', 'DUPLICATE')),
  error_code       TEXT,
  error_message    TEXT,
  server_response  TEXT,
  retry_count      INTEGER NOT NULL DEFAULT 0,
  max_retries      INTEGER NOT NULL DEFAULT 5,
  next_retry_at    TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  pushed_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_queue_status ON event_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_retry ON event_queue(next_retry_at);

-- Curseur de sync (singleton)
CREATE TABLE IF NOT EXISTS sync_cursors (
  id           INTEGER PRIMARY KEY CHECK(id = 1),
  pull_cursor  TEXT,
  last_pull_at TEXT,
  device_id    TEXT NOT NULL
);

-- Session auth cachée
CREATE TABLE IF NOT EXISTS auth_session (
  id               INTEGER PRIMARY KEY CHECK(id = 1),
  user_id          TEXT NOT NULL,
  email            TEXT NOT NULL,
  role             TEXT NOT NULL,
  display_name     TEXT,
  token_expires_at TEXT NOT NULL,
  cached_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);
`;
