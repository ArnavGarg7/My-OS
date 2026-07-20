CREATE TABLE "ai_cost_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" text NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"feature" text DEFAULT '' NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_execution_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"conversation_id" uuid,
	"feature" text DEFAULT '' NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"prompt_version" text,
	"context_builders" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"memory_retrieved" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latencies" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"fallbacks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grounded" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage" text NOT NULL,
	"feature" text DEFAULT '' NOT NULL,
	"ms" real DEFAULT 0 NOT NULL,
	"breached" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompt_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"result" text DEFAULT 'valid' NOT NULL,
	"issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" text NOT NULL,
	"provider" text NOT NULL,
	"quality" real DEFAULT 0 NOT NULL,
	"tool_accuracy" real DEFAULT 0 NOT NULL,
	"latency_ms" real DEFAULT 0 NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"recommended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_reliability_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"recovered" boolean DEFAULT true NOT NULL,
	"final_provider" text DEFAULT 'local' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"actions_taken" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_prompt_versions" ADD COLUMN "purpose" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_prompt_versions" ADD COLUMN "required_tools" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_prompt_versions" ADD COLUMN "changelog" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_prompt_versions" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "ai_cost_metrics_day_idx" ON "ai_cost_metrics" USING btree ("day");--> statement-breakpoint
CREATE INDEX "ai_execution_traces_trace_idx" ON "ai_execution_traces" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "ai_performance_metrics_stage_idx" ON "ai_performance_metrics" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "ai_prompt_tests_name_idx" ON "ai_prompt_tests" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ai_provider_benchmarks_scenario_idx" ON "ai_provider_benchmarks" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "ai_reliability_events_kind_idx" ON "ai_reliability_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "ai_security_events_kind_idx" ON "ai_security_events" USING btree ("kind");