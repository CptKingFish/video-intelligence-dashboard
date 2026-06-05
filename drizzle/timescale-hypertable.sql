-- Run this against your TimescaleDB instance AFTER the `stim_projections`
-- table exists (via `pnpm db:migrate` on Timescale or `pnpm db:setup-timescale`).

CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable(
  'stim_projections',
  'timestep',
  chunk_time_interval => 1000,
  if_not_exists => TRUE,
  migrate_data => TRUE
);

CREATE INDEX IF NOT EXISTS stim_projections_project_time_idx
  ON stim_projections (project_id, time_sec);
