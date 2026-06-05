import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { VideoAnalysisSchema } from "@/lib/types";

/**
 * Drizzle schema.
 *
 * Two logical databases share these definitions:
 *  - NEON (relational): `projects` — one row per uploadthing video + analysis JSON.
 *  - TIMESCALEDB (time-series): `stim_projections` — hypertable on `timestep`.
 *
 * Run migrations with `pnpm db:generate && pnpm db:migrate`.
 * After the first Timescale migration, run `pnpm db:setup-timescale`.
 */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** UploadThing file key — canonical analysis keyed per owner. */
    uploadthingKey: text("uploadthing_key").notNull(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    videoUrl: text("video_url"),
    status: text("status", {
      enum: ["queued", "processing", "ready", "failed"],
    })
      .notNull()
      .default("queued"),
    durationSeconds: real("duration_seconds").notNull().default(0),
    /** TRIBE v2 analysis schema (stimulation_timeline, suggested_edits, etc.). */
    analysis: jsonb("analysis").$type<VideoAnalysisSchema>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("projects_owner_uploadthing_key_idx").on(
      table.ownerId,
      table.uploadthingKey,
    ),
  ],
);

/** Time-series rows — becomes a TimescaleDB hypertable on `time_sec`. */
export const stimProjections = pgTable("stim_projections", {
  projectId: uuid("project_id").notNull(),
  timestep: integer("timestep").notNull(),
  timeSec: doublePrecision("time_sec").notNull(),
  stimProjection: real("stim_projection").notNull(),
  cosineToStim: real("cosine_to_stim").notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type StimProjectionRow = typeof stimProjections.$inferSelect;
