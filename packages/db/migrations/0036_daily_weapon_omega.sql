CREATE TABLE "prediction_confidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"level" text DEFAULT 'low' NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"predicted_value" real DEFAULT 0 NOT NULL,
	"realized_value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"risks" integer DEFAULT 0 NOT NULL,
	"opportunities" integer DEFAULT 0 NOT NULL,
	"on_track" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"version" text DEFAULT '1' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid,
	"scenario" text NOT NULL,
	"effects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"net_delta" real DEFAULT 0 NOT NULL,
	"confidence" text DEFAULT 'low' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"when_bucket" text DEFAULT 'forecast' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"confidence" text DEFAULT 'low' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"outlook" text DEFAULT 'neutral' NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"horizon_days" integer DEFAULT 0 NOT NULL,
	"target_date" timestamp with time zone,
	"trend" jsonb,
	"explanation" jsonb NOT NULL,
	"related_objects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dedupe_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "prediction_confidence_prediction_idx" ON "prediction_confidence" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "prediction_features_prediction_idx" ON "prediction_features" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "prediction_history_prediction_idx" ON "prediction_history" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "prediction_models_kind_idx" ON "prediction_models" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "prediction_scenarios_prediction_idx" ON "prediction_scenarios" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "prediction_timelines_when_idx" ON "prediction_timelines" USING btree ("when_bucket");--> statement-breakpoint
CREATE INDEX "predictions_kind_idx" ON "predictions" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "predictions_dedupe_idx" ON "predictions" USING btree ("dedupe_key");