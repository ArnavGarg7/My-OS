CREATE TYPE "public"."decision_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('pending', 'accepted', 'dismissed', 'deferred', 'expired', 'completed');--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "status" "decision_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "priority" "decision_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "rule_id" text;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "deferred_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decision_history" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;