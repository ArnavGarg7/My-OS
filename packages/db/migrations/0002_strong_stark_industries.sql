CREATE TYPE "public"."day_status" AS ENUM('idle', 'planning', 'active', 'break', 'wrapping_up', 'done');--> statement-breakpoint
CREATE TYPE "public"."energy_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('note', 'thought', 'focus');--> statement-breakpoint
CREATE TABLE "daily_focus" (
	"date" date PRIMARY KEY NOT NULL,
	"mission" text,
	"blocker" text,
	"priority" text,
	"deep_work" text,
	"quick_win" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"date" date PRIMARY KEY NOT NULL,
	"completed_tasks" integer DEFAULT 0 NOT NULL,
	"deep_work_minutes" integer DEFAULT 0 NOT NULL,
	"meetings" integer DEFAULT 0 NOT NULL,
	"interruptions" integer DEFAULT 0 NOT NULL,
	"focus_switches" integer DEFAULT 0 NOT NULL,
	"planner_accuracy" integer,
	"energy_entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"type" "note_type" DEFAULT 'note' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_state" (
	"date" date PRIMARY KEY NOT NULL,
	"wake_time" text,
	"sleep_target" text,
	"energy_level" "energy_level",
	"focus_score" integer,
	"current_block" text,
	"current_activity" text,
	"status" "day_status" DEFAULT 'idle' NOT NULL,
	"morning_completed" boolean DEFAULT false NOT NULL,
	"evening_completed" boolean DEFAULT false NOT NULL,
	"last_recalculated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"confidence" integer,
	"accepted" boolean DEFAULT false NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_date_daily_state_date_fk" FOREIGN KEY ("date") REFERENCES "public"."daily_state"("date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_date_daily_state_date_fk" FOREIGN KEY ("date") REFERENCES "public"."daily_state"("date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_notes" ADD CONSTRAINT "daily_notes_date_daily_state_date_fk" FOREIGN KEY ("date") REFERENCES "public"."daily_state"("date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_history" ADD CONSTRAINT "decision_history_date_daily_state_date_fk" FOREIGN KEY ("date") REFERENCES "public"."daily_state"("date") ON DELETE cascade ON UPDATE no action;