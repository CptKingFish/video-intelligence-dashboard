#!/usr/bin/env node
/**
 * Bootstrap TimescaleDB for stim_projections.
 *
 * Creates the time-series table, enables the extension, promotes it to a
 * hypertable, and adds the project_id + time_sec index. Safe to re-run.
 *
 * Usage: pnpm db:setup-timescale
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function timescaleConnectionString(raw) {
  if (raw.includes("uselibpqcompat")) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}uselibpqcompat=true&sslmode=require`;
}

function createPool(connectionString) {
  return new Pool({
    connectionString: timescaleConnectionString(connectionString),
    connectionTimeoutMillis: 15_000,
    ssl: connectionString.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });
}

async function tableExists(pool, name) {
  const { rows } = await pool.query(`SELECT to_regclass($1) AS regclass`, [
    name,
  ]);
  return rows[0]?.regclass !== null;
}

async function isHypertable(pool, name) {
  const { rows } = await pool.query(
    `SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = $1 LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

async function dropLegacyTable(pool) {
  const hasLegacy = await tableExists(pool, "timeline_points");
  if (!hasLegacy) return;

  console.log("Dropping legacy timeline_points hypertable…");
  await pool.query("DROP TABLE IF EXISTS timeline_points CASCADE");
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const connectionString = process.env.TIMESCALE_URL;
  if (!connectionString) {
    console.error("TIMESCALE_URL is missing. Add it to .env.local.");
    process.exit(1);
  }

  const pool = createPool(connectionString);

  try {
    console.log("Connecting to TimescaleDB…");
    await pool.query("SELECT 1");

    await dropLegacyTable(pool);

    const hasTable = await tableExists(pool, "stim_projections");
    if (!hasTable) {
      console.log("Creating stim_projections table…");
      await pool.query(`
        CREATE TABLE stim_projections (
          project_id uuid NOT NULL,
          timestep integer NOT NULL,
          time_sec double precision NOT NULL,
          stim_projection real NOT NULL,
          cosine_to_stim real NOT NULL
        )
      `);
    } else {
      console.log("stim_projections already exists.");
    }

    console.log("Enabling timescaledb extension…");
    await pool.query("CREATE EXTENSION IF NOT EXISTS timescaledb");

    const hypertable = await isHypertable(pool, "stim_projections");
    if (!hypertable) {
      console.log("Promoting stim_projections to hypertable…");
      await pool.query(`
        SELECT create_hypertable(
          'stim_projections',
          'timestep',
          chunk_time_interval => 1000,
          if_not_exists => TRUE,
          migrate_data => TRUE
        )
      `);
    } else {
      console.log("stim_projections is already a hypertable.");
    }

    console.log("Creating index stim_projections_project_time_idx…");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS stim_projections_project_time_idx
        ON stim_projections (project_id, time_sec)
    `);

    const { rows: tables } = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log(
      "Public tables:",
      tables.map((r) => r.tablename).join(", ") || "(none)",
    );

    const { rows: hypertables } = await pool.query(`
      SELECT hypertable_name FROM timescaledb_information.hypertables
    `);
    console.log(
      "Hypertables:",
      hypertables.map((r) => r.hypertable_name).join(", ") || "(none)",
    );

    console.log("TimescaleDB setup complete.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("TimescaleDB setup failed:", error.message ?? error);
  process.exit(1);
});
