#!/usr/bin/env node
/**
 * Seed TRIBE v2 analysis data into Neon (projects) and Timescale (stim_projections).
 *
 * Usage: pnpm db:seed
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

const UFS_BASE = "https://yjdzbero6a.ufs.sh/f";
const SEED_OWNER = "seed";
const BATCH_SIZE = 500;

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

function buildConnectionString(raw, ssl = true) {
  if (!raw) return null;
  let url = raw;
  if (!url.includes("uselibpqcompat")) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}uselibpqcompat=true&sslmode=require`;
  }
  return url;
}

function createPool(raw) {
  const connStr = buildConnectionString(raw);
  if (!connStr) return null;

  return new Pool({
    connectionString: connStr,
    connectionTimeoutMillis: 15_000,
    ssl: raw.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
}

function loadSeedFixtures() {
  const dir = resolve(process.cwd(), "scripts/seed-data");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const raw = readFileSync(resolve(dir, name), "utf8");
      return JSON.parse(raw);
    });
}

async function deleteExisting(neon, projectionPool, uploadthingKey, fixtureId) {
  const { rows } = await neon.query(
    `SELECT id FROM projects WHERE uploadthing_key = $1 LIMIT 1`,
    [uploadthingKey],
  );

  const projectId = rows[0]?.id ?? fixtureId;

  await projectionPool.query(`DELETE FROM stim_projections WHERE project_id = $1`, [
    projectId,
  ]);

  if (rows.length > 0) {
    await neon.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  }
}

async function insertProject(neon, fixture) {
  const videoUrl = `${UFS_BASE}/${fixture.uploadthingKey}`;
  await neon.query(
    `INSERT INTO projects (
      id, uploadthing_key, owner_id, title, thumbnail_url, video_url,
      status, duration_seconds, analysis, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'ready', $7, $8::jsonb, NOW())`,
    [
      fixture.id,
      fixture.uploadthingKey,
      SEED_OWNER,
      fixture.title,
      videoUrl,
      videoUrl,
      fixture.durationSeconds,
      JSON.stringify(fixture.analysis),
    ],
  );
}

async function insertProjections(pool, projectId, projections) {
  for (let i = 0; i < projections.length; i += BATCH_SIZE) {
    const batch = projections.slice(i, i + BATCH_SIZE);
    const values = [];
    const params = [];
    let paramIndex = 1;

    for (const row of batch) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
      );
      params.push(
        projectId,
        row.timestep,
        row.timeSec,
        row.stimProjection,
        row.cosineToStim,
      );
    }

    await pool.query(
      `INSERT INTO stim_projections (project_id, timestep, time_sec, stim_projection, cosine_to_stim)
       VALUES ${values.join(", ")}`,
      params,
    );
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const neonUrl = process.env.DATABASE_URL;
  if (!neonUrl) {
    console.error("DATABASE_URL is missing. Add it to .env.local.");
    process.exit(1);
  }

  const neon = createPool(neonUrl);
  const timescale = createPool(process.env.TIMESCALE_URL);
  const projectionPool = timescale ?? neon;

  const fixtures = loadSeedFixtures();
  console.log(`Seeding ${fixtures.length} videos…`);

  try {
    await neon.query("SELECT 1");
    await projectionPool.query("SELECT 1");

    for (const fixture of fixtures) {
      console.log(`→ ${fixture.title} (${fixture.uploadthingKey.slice(0, 12)}…)`);

      await deleteExisting(
        neon,
        projectionPool,
        fixture.uploadthingKey,
        fixture.id,
      );

      await insertProject(neon, fixture);
      await insertProjections(projectionPool, fixture.id, fixture.projections);

      console.log(
        `  ✓ project + ${fixture.projections.length} projection rows`,
      );
    }

    console.log("Seed complete.");
  } finally {
    await neon.end();
    if (timescale) await timescale.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});
