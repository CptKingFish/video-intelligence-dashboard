import { isNeonEnabled, isTimescaleEnabled } from "@/lib/env";

/**
 * Lazily-constructed Drizzle clients.
 *
 * - Neon uses the serverless HTTP driver (`@neondatabase/serverless`).
 * - TimescaleDB uses a standard `pg` Pool (plain Postgres + extension).
 */

import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import { timescalePoolConfig } from "@/lib/db/timescale-pool";

const globalForDb = globalThis as unknown as {
  __neonDb?: NeonHttpDatabase<typeof schema>;
  __timescaleDb?: NodePgDatabase<typeof schema>;
  __timescaleReachable?: boolean;
};

/** Cached result of a one-shot Timescale connectivity probe. */
export async function isTimescaleReachable(): Promise<boolean> {
  if (!isTimescaleEnabled) return false;
  if (globalForDb.__timescaleReachable !== undefined) {
    return globalForDb.__timescaleReachable;
  }

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      ...timescalePoolConfig(process.env.TIMESCALE_URL!),
      max: 1,
    });
    await pool.query("SELECT 1");
    await pool.end();
    globalForDb.__timescaleReachable = true;
  } catch (error) {
    console.warn(
      "[db] TimescaleDB unreachable; falling back to Neon for stim_projections.",
      error instanceof Error ? error.message : error,
    );
    globalForDb.__timescaleReachable = false;
  }

  return globalForDb.__timescaleReachable;
}

export async function getNeonDb(): Promise<NeonHttpDatabase<
  typeof schema
> | null> {
  if (!isNeonEnabled) return null;
  if (globalForDb.__neonDb) return globalForDb.__neonDb;

  const { neon, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  // Reuse HTTP connections across requests (helps with Neon cold starts).
  neonConfig.fetchConnectionCache = true;
  const sql = neon(process.env.DATABASE_URL!);
  globalForDb.__neonDb = drizzle(sql, { schema });
  return globalForDb.__neonDb;
}

export async function getTimescaleDb(): Promise<NodePgDatabase<
  typeof schema
> | null> {
  if (!isTimescaleEnabled) return null;
  if (globalForDb.__timescaleDb) return globalForDb.__timescaleDb;

  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool(timescalePoolConfig(process.env.TIMESCALE_URL!));
  globalForDb.__timescaleDb = drizzle(pool, { schema });
  return globalForDb.__timescaleDb;
}
