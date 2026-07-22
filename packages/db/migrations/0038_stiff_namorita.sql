CREATE TABLE "connector_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_key" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"state" text DEFAULT 'disconnected' NOT NULL,
	"checkpoint" text,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"checkpoint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"tag" text NOT NULL,
	"hint" text DEFAULT '' NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"provider_key" text NOT NULL,
	"kind" text NOT NULL,
	"external_id" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"state" text DEFAULT 'disconnected' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"latency_ms" real DEFAULT 0 NOT NULL,
	"sync_age_minutes" integer DEFAULT 0 NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"rate_limited" boolean DEFAULT false NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"syncs" integer DEFAULT 0 NOT NULL,
	"events_processed" integer DEFAULT 0 NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"retries" integer DEFAULT 0 NOT NULL,
	"avg_sync_ms" real DEFAULT 0 NOT NULL,
	"rate_limit_hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_key" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"auth" text DEFAULT 'oauth2' NOT NULL,
	"supported_events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sync_strategy" text DEFAULT 'polling' NOT NULL,
	"version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"remaining" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"events_processed" integer DEFAULT 0 NOT NULL,
	"dropped" integer DEFAULT 0 NOT NULL,
	"duration_ms" real DEFAULT 0 NOT NULL,
	"ok" boolean DEFAULT true NOT NULL,
	"checkpoint" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"mode" text DEFAULT 'incremental' NOT NULL,
	"trigger" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"endpoint" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "connector_accounts_provider_idx" ON "connector_accounts" USING btree ("provider_key");--> statement-breakpoint
CREATE INDEX "connector_checkpoints_account_idx" ON "connector_checkpoints" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "connector_credentials_account_idx" ON "connector_credentials" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "connector_events_account_idx" ON "connector_events" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "connector_events_kind_idx" ON "connector_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "connector_health_account_idx" ON "connector_health" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "connector_providers_key_idx" ON "connector_providers" USING btree ("provider_key");--> statement-breakpoint
CREATE INDEX "connector_sync_history_account_idx" ON "connector_sync_history" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "connector_sync_jobs_account_idx" ON "connector_sync_jobs" USING btree ("account_id");