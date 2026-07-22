CREATE TABLE "signal_context_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_id" uuid NOT NULL,
	"window" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ref_module" text,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_id" uuid NOT NULL,
	"level" text DEFAULT 'silent' NOT NULL,
	"surfaced" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_id" uuid NOT NULL,
	"importance" real DEFAULT 0 NOT NULL,
	"urgency" real DEFAULT 0 NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"recency" real DEFAULT 0 NOT NULL,
	"impact" real DEFAULT 0 NOT NULL,
	"priority" real DEFAULT 0 NOT NULL,
	"ranked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"min_level" text DEFAULT 'suggestion' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_id" text NOT NULL,
	"kind" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"events_emitted" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"window" text DEFAULT 'current' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"dedupe_key" text NOT NULL,
	"explanation" jsonb NOT NULL,
	"related_objects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"event_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "signal_context_windows_window_idx" ON "signal_context_windows" USING btree ("window");--> statement-breakpoint
CREATE INDEX "signal_events_source_idx" ON "signal_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "signal_notifications_signal_idx" ON "signal_notifications" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "signal_rankings_signal_idx" ON "signal_rankings" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "signal_timeline_signal_idx" ON "signal_timeline" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "signal_watchers_module_idx" ON "signal_watchers" USING btree ("module");--> statement-breakpoint
CREATE INDEX "signals_status_idx" ON "signals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signals_dedupe_idx" ON "signals" USING btree ("dedupe_key");