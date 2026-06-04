ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "insights" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sample_id" text;
