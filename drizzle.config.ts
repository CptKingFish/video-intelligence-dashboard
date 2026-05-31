import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Defaults to the Neon (relational) database. To generate/migrate the
 * TimescaleDB time-series tables instead, point `DATABASE_URL` at
 * `TIMESCALE_URL` for the run, e.g.:
 *
 *   DATABASE_URL=$TIMESCALE_URL npm run db:migrate
 *
 * Then apply the hypertable SQL in `drizzle/timescale-hypertable.sql`.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/videointel",
  },
  verbose: true,
  strict: true,
});
