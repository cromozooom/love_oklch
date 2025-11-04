-- Add color_count column to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "color_count" INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN "projects"."color_count" IS 'DEMO: Number of colors (for testing history tracking)';
