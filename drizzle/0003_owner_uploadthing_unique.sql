ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_uploadthing_key_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "projects_owner_uploadthing_key_idx" ON "projects" ("owner_id","uploadthing_key");
