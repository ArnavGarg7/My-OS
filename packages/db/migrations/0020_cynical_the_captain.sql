CREATE TYPE "public"."orchestration_status" AS ENUM('pending', 'running', 'completed', 'recovering', 'recovered', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."orchestration_step" AS ENUM('calendar', 'planner', 'focus', 'task', 'decision', 'health', 'finance', 'goal', 'project', 'inbox', 'notification', 'morning', 'tomorrow', 'timeline', 'analytics');--> statement-breakpoint
CREATE TYPE "public"."recovery_strategy" AS ENUM('retry_step', 'skip_downstream', 'use_previous', 'skip_step', 'notify_user', 'abort');--> statement-breakpoint
CREATE TABLE "orchestration_failures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"module" "orchestration_step" NOT NULL,
	"error" text NOT NULL,
	"strategy" "recovery_strategy" NOT NULL,
	"recovered" boolean DEFAULT false NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestration_recovery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"module" "orchestration_step" NOT NULL,
	"strategy" "recovery_strategy" NOT NULL,
	"skipped" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestration_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline" text NOT NULL,
	"trigger" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"status" "orchestration_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"runtime_ms" integer,
	"affected" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skipped" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"recoveries" integer DEFAULT 0 NOT NULL,
	"summary" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestration_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"module" "orchestration_step" NOT NULL,
	"step_order" integer DEFAULT 0 NOT NULL,
	"outcome" text NOT NULL,
	"mode" text NOT NULL,
	"runtime_ms" integer,
	"detail" text
);
--> statement-breakpoint
ALTER TABLE "orchestration_failures" ADD CONSTRAINT "orchestration_failures_run_id_orchestration_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."orchestration_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orchestration_recovery" ADD CONSTRAINT "orchestration_recovery_run_id_orchestration_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."orchestration_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orchestration_steps" ADD CONSTRAINT "orchestration_steps_run_id_orchestration_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."orchestration_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orchestration_failures_run_idx" ON "orchestration_failures" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "orchestration_recovery_run_idx" ON "orchestration_recovery" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "orchestration_runs_status_idx" ON "orchestration_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orchestration_runs_started_idx" ON "orchestration_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "orchestration_steps_run_idx" ON "orchestration_steps" USING btree ("run_id");