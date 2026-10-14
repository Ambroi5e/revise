-- Usage reports from friends who agreed to share them at first launch.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device TEXT NOT NULL,
  name TEXT,
  program TEXT,
  event TEXT NOT NULL,
  day TEXT NOT NULL,
  stats TEXT,
  country TEXT,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_device ON events (device);
CREATE INDEX IF NOT EXISTS events_day ON events (day);

-- AI relay: units spent per day and per student (or device), and Google tokens already checked.
CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT NOT NULL,
  who TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, who)
);
CREATE TABLE IF NOT EXISTS ai_tokens (
  hash TEXT PRIMARY KEY,
  sub TEXT NOT NULL,
  exp INTEGER NOT NULL
);
