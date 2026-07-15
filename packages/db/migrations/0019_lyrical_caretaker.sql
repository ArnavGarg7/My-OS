CREATE TYPE "public"."action_kind" AS ENUM('generate_notification', 'start_focus', 'pause_focus', 'resume_focus', 'complete_focus', 'generate_planner', 'regenerate_planner', 'open_tomorrow', 'mark_decision_complete', 'generate_decision', 'dismiss_decision', 'open_journal', 'log_timeline_event', 'emit_analytics_event', 'create_reminder', 'complete_reminder', 'run_custom_workflow', 'noop');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('created', 'enabled', 'disabled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."execution_policy" AS ENUM('run_once', 'run_always', 'cooldown', 'throttle', 'max_executions', 'retry', 'delay', 'schedule', 'manual_approval');--> statement-breakpoint
CREATE TYPE "public"."trigger_kind" AS ENUM('planner', 'task', 'focus', 'calendar', 'notification', 'health', 'journal', 'finance', 'goals', 'projects', 'timeline', 'analytics', 'tomorrow', 'morning', 'inbox', 'manual', 'time');--> statement-breakpoint
CREATE TABLE "automation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"kind" "action_kind" NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"tree" jsonb DEFAULT '{"combinator":"and","conditions":[]}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"outcome" text NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"runtime_ms" integer,
	"action_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "automation_status" DEFAULT 'created' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"trigger_kind" "trigger_kind" NOT NULL,
	"trigger_event" text DEFAULT '' NOT NULL,
	"policy" jsonb DEFAULT '{"policy":"run_always"}'::jsonb NOT NULL,
	"built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"executions" integer DEFAULT 0 NOT NULL,
	"successes" integer DEFAULT 0 NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"average_runtime_ms" integer DEFAULT 0 NOT NULL,
	"failure_rate" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_outcome" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "automation_statistics_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_conditions" ADD CONSTRAINT "automation_conditions_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_history" ADD CONSTRAINT "automation_history_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_statistics" ADD CONSTRAINT "automation_statistics_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_actions_rule_idx" ON "automation_actions" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "automation_history_rule_idx" ON "automation_history" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "automation_history_at_idx" ON "automation_history" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "automation_rules_status_idx" ON "automation_rules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_rules_trigger_idx" ON "automation_rules" USING btree ("trigger_kind");