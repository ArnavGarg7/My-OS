CREATE TYPE "public"."planner_block_type" AS ENUM('focus', 'meeting', 'task', 'break', 'buffer', 'overflow');--> statement-breakpoint
CREATE TYPE "public"."planner_status" AS ENUM('empty', 'generated', 'optimized');--> statement-breakpoint
CREATE TABLE "planner_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planner_date" date NOT NULL,
	"task_id" uuid,
	"type" "planner_block_type" DEFAULT 'task' NOT NULL,
	"title" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"generated" boolean DEFAULT true NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_days" (
	"date" date PRIMARY KEY NOT NULL,
	"generated_at" timestamp with time zone,
	"working_start" text DEFAULT '09:00' NOT NULL,
	"working_end" text DEFAULT '18:00' NOT NULL,
	"focus_window_start" text,
	"focus_window_end" text,
	"status" "planner_status" DEFAULT 'empty' NOT NULL,
	"locked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planner_date" date NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner_blocks" ADD CONSTRAINT "planner_blocks_planner_date_planner_days_date_fk" FOREIGN KEY ("planner_date") REFERENCES "public"."planner_days"("date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_history" ADD CONSTRAINT "planner_history_planner_date_planner_days_date_fk" FOREIGN KEY ("planner_date") REFERENCES "public"."planner_days"("date") ON DELETE cascade ON UPDATE no action;