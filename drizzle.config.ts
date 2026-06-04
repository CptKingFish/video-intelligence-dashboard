import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

/** Drizzle Kit does not load Next.js env files — mirror .env.local loading here. */
function loadEnvFile(filename: string): void {
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

loadEnvFile(".env.local");
loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Add your Neon connection string to .env.local, then run pnpm db:migrate.",
  );
}

/**
 * Drizzle Kit configuration.
 *
 * Defaults to the Neon (relational) database. To generate/migrate the
 * TimescaleDB time-series tables instead, point `DATABASE_URL` at
 * `TIMESCALE_URL` for the run, e.g.:
 *
 *   DATABASE_URL=$TIMESCALE_URL pnpm db:migrate
 *
 * Then apply the hypertable SQL in `drizzle/timescale-hypertable.sql`.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
