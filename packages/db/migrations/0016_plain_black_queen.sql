CREATE TYPE "public"."tomorrow_status" AS ENUM('draft', 'planned', 'locked', 'completed');--> statement-breakpoint
CREATE TABLE "tomorrow_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"item" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tomorrow_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planning_date" date NOT NULL,
	"target_date" date NOT NULL,
	"status" "tomorrow_status" DEFAULT 'draft' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tomorrow_plans_planning_date_unique" UNIQUE("planning_date")
);
--> statement-breakpoint
CREATE TABLE "tomorrow_priorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"priority_order" integer DEFAULT 0 NOT NULL,
	"task_id" uuid,
	"project_id" uuid,
	"goal_id" uuid,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tomorrow_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planning_date" date NOT NULL,
	"completion_score" integer DEFAULT 0 NOT NULL,
	"planner_accuracy" integer DEFAULT 0 NOT NULL,
	"deep_work" integer DEFAULT 0 NOT NULL,
	"unfinished_tasks" integer DEFAULT 0 NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tomorrow_reviews_planning_date_unique" UNIQUE("planning_date")
);
--> statement-breakpoint
ALTER TABLE "tomorrow_checklist" ADD CONSTRAINT "tomorrow_checklist_plan_id_tomorrow_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."tomorrow_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tomorrow_priorities" ADD CONSTRAINT "tomorrow_priorities_plan_id_tomorrow_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."tomorrow_plans"("id") ON DELETE cascade ON UPDATE no action;