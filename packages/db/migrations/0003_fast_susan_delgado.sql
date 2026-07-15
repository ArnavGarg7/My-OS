ALTER TYPE "public"."note_type" ADD VALUE 'reflection';--> statement-breakpoint
ALTER TYPE "public"."note_type" ADD VALUE 'idea';--> statement-breakpoint
ALTER TABLE "daily_state" ADD COLUMN "morning_completed_at" timestamp with time zone;