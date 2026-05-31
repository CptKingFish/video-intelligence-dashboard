-- Run this against your TimescaleDB instance AFTER the `timeline_points`
-- table has been created (via `DATABASE_URL=$TIMESCALE_URL npm run db:migrate`).
--
-- It enables the extension and promotes the table to a hypertable partitioned
-- on the per-second offset `t`, which is what makes range scans over the
-- analysis timeline fast at scale.

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Partition into ~1 hour (3600s) chunks. `migrate_data` handles a non-empty
-- table; drop it for a fresh table.
SELECT create_hypertable(
  'timeline_points',
  't',
  chunk_time_interval => 3600,
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Common access pattern: fetch one project's full timeline in order.
CREATE INDEX IF NOT EXISTS timeline_points_project_t_idx
  ON timeline_points (project_id, t);
