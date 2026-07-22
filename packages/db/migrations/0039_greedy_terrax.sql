CREATE TABLE "adaptation_confidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"level" text DEFAULT 'unknown' NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adaptation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"subject" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adaptation_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"mode" text DEFAULT 'suggested' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavioral_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"label" text NOT NULL,
	"value" real DEFAULT 0 NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"trend" text DEFAULT 'flat' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_key" text NOT NULL,
	"strength" real DEFAULT 0 NOT NULL,
	"consistency" real DEFAULT 0 NOT NULL,
	"trend" text DEFAULT 'steady' NOT NULL,
	"break_probability" real DEFAULT 0 NOT NULL,
	"recovery_rate" real DEFAULT 0 NOT NULL,
	"confidence_level" text DEFAULT 'unknown' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"headline" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"confidence_level" text DEFAULT 'unknown' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pref_key" text NOT NULL,
	"category" text NOT NULL,
	"value" text NOT NULL,
	"source" text DEFAULT 'implicit' NOT NULL,
	"confidence_level" text DEFAULT 'unknown' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_key" text NOT NULL,
	"category" text NOT NULL,
	"value" text NOT NULL,
	"confidence_level" text DEFAULT 'unknown' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" text NOT NULL,
	"subject" text NOT NULL,
	"type" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_key" text NOT NULL,
	"label" text NOT NULL,
	"day_of_week" integer,
	"hour" integer,
	"occurrences" integer DEFAULT 0 NOT NULL,
	"confidence_level" text DEFAULT 'unknown' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "adaptation_events_kind_idx" ON "adaptation_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "behavioral_metrics_key_idx" ON "behavioral_metrics" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "habit_models_key_idx" ON "habit_models" USING btree ("habit_key");--> statement-breakpoint
CREATE INDEX "personal_insights_category_idx" ON "personal_insights" USING btree ("category");--> statement-breakpoint
CREATE INDEX "personal_preferences_key_idx" ON "personal_preferences" USING btree ("pref_key");--> statement-breakpoint
CREATE INDEX "personal_profiles_key_idx" ON "personal_profiles" USING btree ("field_key");--> statement-breakpoint
CREATE INDEX "recommendation_feedback_subject_idx" ON "recommendation_feedback" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "routine_models_key_idx" ON "routine_models" USING btree ("routine_key");