CREATE TABLE "ai_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"kind" text DEFAULT 'response' NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"value" jsonb NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_eval_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suite" text NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"passed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"cases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"owner" text DEFAULT 'platform' NOT NULL,
	"template" text DEFAULT '' NOT NULL,
	"compatible_models" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_schema" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"state" text DEFAULT 'unavailable' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_stream_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text NOT NULL,
	"feature" text DEFAULT '' NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'streaming' NOT NULL,
	"accumulated_chars" integer DEFAULT 0 NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"latency_ms" real DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "ai_cache_key_idx" ON "ai_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "ai_eval_runs_suite_idx" ON "ai_eval_runs" USING btree ("suite");--> statement-breakpoint
CREATE INDEX "ai_prompt_versions_name_idx" ON "ai_prompt_versions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ai_provider_health_provider_idx" ON "ai_provider_health" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_stream_sessions_request_idx" ON "ai_stream_sessions" USING btree ("request_id");