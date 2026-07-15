CREATE TYPE "public"."goal_metric_type" AS ENUM('numeric', 'percentage', 'boolean', 'milestone');--> statement-breakpoint
CREATE TYPE "public"."goal_review_period" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('planned', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('life', 'career', 'education', 'health', 'finance', 'personal');--> statement-breakpoint
CREATE TYPE "public"."habit_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "goal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"journal_entry_id" uuid,
	"finance_goal_id" uuid,
	"health_metric" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"review_period" "goal_review_period" NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"progress_snapshot" double precision DEFAULT 0 NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"goal_type" "goal_type" DEFAULT 'personal' NOT NULL,
	"status" "goal_status" DEFAULT 'planned' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"target_date" date,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid,
	"title" text NOT NULL,
	"frequency" "habit_frequency" DEFAULT 'daily' NOT NULL,
	"target" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_completed" date,
	"active" boolean DEFAULT true NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"objective_id" uuid NOT NULL,
	"title" text NOT NULL,
	"metric_type" "goal_metric_type" DEFAULT 'numeric' NOT NULL,
	"current_value" double precision DEFAULT 0 NOT NULL,
	"target_value" double precision DEFAULT 100 NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_links" ADD CONSTRAINT "goal_links_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_objectives" ADD CONSTRAINT "goal_objectives_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_reviews" ADD CONSTRAINT "goal_reviews_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_objective_id_goal_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."goal_objectives"("id") ON DELETE cascade ON UPDATE no action;