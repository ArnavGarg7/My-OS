CREATE TYPE "public"."entry_type" AS ENUM('daily', 'reflection', 'gratitude', 'review', 'idea');--> statement-breakpoint
CREATE TYPE "public"."mood_level" AS ENUM('very_low', 'low', 'neutral', 'good', 'excellent');--> statement-breakpoint
CREATE TYPE "public"."review_period" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TABLE "daily_reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"reflection" text DEFAULT '' NOT NULL,
	"wins" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lessons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gratitude" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tomorrow_focus" text DEFAULT '' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_reflections_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"entry_type" "entry_type" DEFAULT 'daily' NOT NULL,
	"mood" "mood_level",
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"task_id" uuid,
	"project_id" uuid,
	"milestone_id" uuid,
	"decision_id" uuid,
	"planner_block_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" "review_period" NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_links" ADD CONSTRAINT "journal_links_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;