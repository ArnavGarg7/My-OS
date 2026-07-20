CREATE TABLE "ai_provider_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability" text NOT NULL,
	"provider_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chief_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recommendation_id" uuid,
	"outcome" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chief_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"action" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"explanation" jsonb NOT NULL,
	"entity_ref" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chief_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text DEFAULT 'now' NOT NULL,
	"context_hash" text DEFAULT '' NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"capability" text DEFAULT 'reasoning' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_ai_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deep_work_preferred_start_hour" integer DEFAULT 9 NOT NULL,
	"deep_work_min_block_minutes" integer DEFAULT 50 NOT NULL,
	"study_preferred_start_hour" integer DEFAULT 16 NOT NULL,
	"workout_preferred_hour" integer DEFAULT 18 NOT NULL,
	"meeting_preference" text DEFAULT 'batch' NOT NULL,
	"planning_style" text DEFAULT 'flexible' NOT NULL,
	"communication_style" text DEFAULT 'concise' NOT NULL,
	"notification_style" text DEFAULT 'proactive' NOT NULL,
	"break_frequency_minutes" integer DEFAULT 50 NOT NULL,
	"review_style" text DEFAULT 'daily' NOT NULL,
	"decision_style" text DEFAULT 'fast' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chief_feedback" ADD CONSTRAINT "chief_feedback_recommendation_id_chief_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."chief_recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chief_recommendations" ADD CONSTRAINT "chief_recommendations_session_id_chief_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chief_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_provider_policies_capability_idx" ON "ai_provider_policies" USING btree ("capability");--> statement-breakpoint
CREATE INDEX "chief_feedback_recommendation_idx" ON "chief_feedback" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "chief_recommendations_session_idx" ON "chief_recommendations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chief_sessions_kind_idx" ON "chief_sessions" USING btree ("kind");