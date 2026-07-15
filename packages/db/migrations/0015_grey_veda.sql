CREATE TYPE "public"."comparison_period" AS ENUM('previous_day', 'previous_week', 'previous_month', 'previous_quarter', 'previous_year');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TABLE "analytics_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_type" "report_type" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_date" date NOT NULL,
	"productivity_score" integer DEFAULT 0 NOT NULL,
	"focus_score" integer DEFAULT 0 NOT NULL,
	"planner_accuracy" integer DEFAULT 0 NOT NULL,
	"health_score" integer DEFAULT 0 NOT NULL,
	"goal_progress" integer DEFAULT 0 NOT NULL,
	"finance_score" integer DEFAULT 0 NOT NULL,
	"journal_score" integer DEFAULT 0 NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_snapshots_snapshot_date_unique" UNIQUE("snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "monthly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
