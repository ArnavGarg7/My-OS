CREATE TYPE "public"."break_type" AS ENUM('short', 'long', 'recovery', 'hydration', 'walk');--> statement-breakpoint
CREATE TYPE "public"."focus_interruption_type" AS ENUM('phone', 'meeting', 'message', 'distraction', 'other');--> statement-breakpoint
CREATE TYPE "public"."focus_session_type" AS ENUM('focus', 'deep_work', 'shallow_work', 'review', 'break', 'recovery', 'planning', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."focus_status" AS ENUM('idle', 'running', 'paused', 'break', 'completed', 'cancelled', 'abandoned');--> statement-breakpoint
CREATE TABLE "focus_breaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "break_type" DEFAULT 'short' NOT NULL,
	"planned_minutes" integer DEFAULT 10 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "focus_daily_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_date" date NOT NULL,
	"focus_minutes" integer DEFAULT 0 NOT NULL,
	"deep_work_minutes" integer DEFAULT 0 NOT NULL,
	"shallow_minutes" integer DEFAULT 0 NOT NULL,
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"interruptions" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"completed_sessions" integer DEFAULT 0 NOT NULL,
	"longest_session_minutes" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"planner_accuracy" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "focus_daily_summary_summary_date_unique" UNIQUE("summary_date")
);
--> statement-breakpoint
CREATE TABLE "focus_interruptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "focus_interruption_type" NOT NULL,
	"note" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"planner_block_id" uuid,
	"project_id" uuid,
	"type" "focus_session_type" DEFAULT 'focus' NOT NULL,
	"status" "focus_status" DEFAULT 'idle' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"paused_duration_ms" integer DEFAULT 0 NOT NULL,
	"paused_at" timestamp with time zone,
	"planned_minutes" integer DEFAULT 50 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"energy_before" integer,
	"energy_after" integer,
	"session_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "focus_breaks" ADD CONSTRAINT "focus_breaks_session_id_focus_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."focus_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_interruptions" ADD CONSTRAINT "focus_interruptions_session_id_focus_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."focus_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "focus_breaks_session_idx" ON "focus_breaks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "focus_interruptions_session_idx" ON "focus_interruptions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "focus_sessions_date_idx" ON "focus_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "focus_sessions_status_idx" ON "focus_sessions" USING btree ("status");