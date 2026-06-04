import {
  doublePrecision,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema.
 *
 * Two logical databases share these definitions:
 *  - NEON (relational): `projects` — one row per uploaded video + metadata.
 *  - TIMESCALEDB (time-series): `timeline_points` — promoted to a hypertable
 *    on `t` for efficient per-second range scans. The embedding vector itself
 *    is stored as JSON text on the project row (swap to pgvector if you add
 *    similarity search).
 *
 * Run migrations with `npm run db:generate && npm run db:migrate`.
 * After the first Timescale migration, create the hypertable (see the SQL in
 * `drizzle/timescale-hypertable.sql` / README).
 */

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  videoUrl: text("video_url"),
  status: text("status", {
    enum: ["queued", "processing", "ready", "failed"],
  })
    .notNull()
    .default("queued"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  fileSizeBytes: integer("file_size_bytes").notNull().default(0),
  embeddingDim: integer("embedding_dim").notNull().default(0),
  /** Raw embedding vector serialized as JSON (or migrate to pgvector). */
  embedding: text("embedding"),
  /** Detected highlights serialized as JSON. */
  highlights: text("highlights"),
  /** Aggregate stats for summary cards, serialized as JSON. */
  stats: text("stats"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Time-series rows — becomes a TimescaleDB hypertable on `t`. */
export const timelinePoints = pgTable("timeline_points", {
  projectId: uuid("project_id").notNull(),
  /** Seconds from the start of the video. */
  t: integer("t").notNull(),
  score: real("score").notNull(),
  energy: real("energy").notNull(),
  motion: real("motion").notNull(),
  recordedAt: doublePrecision("recorded_at").notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type TimelineRow = typeof timelinePoints.$inferSelect;
