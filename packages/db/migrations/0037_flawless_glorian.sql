CREATE TABLE "autopilot_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"state" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"trigger" text NOT NULL,
	"risk" text DEFAULT 'low' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"reversible" boolean DEFAULT true NOT NULL,
	"version" text DEFAULT '1' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_key" text NOT NULL,
	"fact" text NOT NULL,
	"op" text NOT NULL,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"ok" boolean DEFAULT false NOT NULL,
	"results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"duration_ms" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposals" integer DEFAULT 0 NOT NULL,
	"approved" integer DEFAULT 0 NOT NULL,
	"executed" integer DEFAULT 0 NOT NULL,
	"rolled_back" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"trusted_usage" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_key" text NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_key" text NOT NULL,
	"policy" text DEFAULT 'always_ask' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_key" text NOT NULL,
	"title" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"expected_benefit" text DEFAULT '' NOT NULL,
	"risk" text DEFAULT 'low' NOT NULL,
	"rollback_summary" text DEFAULT '' NOT NULL,
	"plan" jsonb NOT NULL,
	"policy" text DEFAULT 'always_ask' NOT NULL,
	"state" text DEFAULT 'pending_approval' NOT NULL,
	"source_kind" text,
	"source_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_rollbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"ok" boolean DEFAULT false NOT NULL,
	"results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid,
	"label" text DEFAULT '' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_key" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autopilot_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "autopilot_audit_proposal_idx" ON "autopilot_audit" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "autopilot_automations_key_idx" ON "autopilot_automations" USING btree ("automation_key");--> statement-breakpoint
CREATE INDEX "autopilot_executions_proposal_idx" ON "autopilot_executions" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "autopilot_policies_key_idx" ON "autopilot_policies" USING btree ("automation_key");--> statement-breakpoint
CREATE INDEX "autopilot_proposals_state_idx" ON "autopilot_proposals" USING btree ("state");--> statement-breakpoint
CREATE INDEX "autopilot_rollbacks_proposal_idx" ON "autopilot_rollbacks" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "autopilot_timelines_proposal_idx" ON "autopilot_timelines" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "autopilot_verifications_proposal_idx" ON "autopilot_verifications" USING btree ("proposal_id");