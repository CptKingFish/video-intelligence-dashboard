CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"video_url" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"file_size_bytes" integer DEFAULT 0 NOT NULL,
	"embedding_dim" integer DEFAULT 0 NOT NULL,
	"embedding" text,
	"highlights" text,
	"stats" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_points" (
	"project_id" uuid NOT NULL,
	"t" integer NOT NULL,
	"score" real NOT NULL,
	"energy" real NOT NULL,
	"motion" real NOT NULL,
	"recorded_at" double precision NOT NULL
);
