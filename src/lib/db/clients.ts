import { isNeonEnabled, isTimescaleEnabled } from "@/lib/env";

/**
 * Lazily-constructed Drizzle clients.
 *
 * - Neon uses the serverless HTTP driver (`@neondatabase/serverless`).
 * - TimescaleDB uses a standard `pg` Pool (it is plain Postgres + extension).
 *
 * Both return `null` when their connection string is absent, which is how the
 * repository layer decides between live and mock behavior.
 */

import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as {
  __neonDb?: NeonHttpDatabase<typeof schema> | null;
  __timescaleDb?: NodePgDatabase<typeof schema> | null;
};

export async function getNeonDb(): Promise<NeonHttpDatabase<
  typeof schema
> | null> {
  if (!isNeonEnabled) return null;
  if (globalForDb.__neonDb !== undefined) return globalForDb.__neonDb;

  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const sql = neon(process.env.DATABASE_URL!);
  globalForDb.__neonDb = drizzle(sql, { schema });
  return globalForDb.__neonDb;
}

export async function getTimescaleDb(): Promise<NodePgDatabase<
  typeof schema
> | null> {
  if (!isTimescaleEnabled) return null;
  if (globalForDb.__timescaleDb !== undefined) return globalForDb.__timescaleDb;

  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: process.env.TIMESCALE_URL });
  globalForDb.__timescaleDb = drizzle(pool, { schema });
  return globalForDb.__timescaleDb;
}
