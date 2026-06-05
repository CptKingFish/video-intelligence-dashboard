DROP TABLE IF EXISTS "timeline_points";--> statement-breakpoint
DROP TABLE IF EXISTS "stim_projections";--> statement-breakpoint
DROP TABLE IF EXISTS "projects";--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploadthing_key" text NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"video_url" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"duration_seconds" real DEFAULT 0 NOT NULL,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_uploadthing_key_unique" UNIQUE("uploadthing_key")
);
--> statement-breakpoint
CREATE TABLE "stim_projections" (
	"project_id" uuid NOT NULL,
	"timestep" integer NOT NULL,
	"time_sec" double precision NOT NULL,
	"stim_projection" real NOT NULL,
	"cosine_to_stim" real NOT NULL
);
