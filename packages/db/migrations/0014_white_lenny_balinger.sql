CREATE TYPE "public"."memory_type" AS ENUM('achievement', 'milestone', 'reflection', 'health', 'finance', 'learning', 'personal');--> statement-breakpoint
CREATE TYPE "public"."snapshot_type" AS ENUM('week', 'month', 'quarter', 'year');--> statement-breakpoint
CREATE TYPE "public"."timeline_source" AS ENUM('today', 'decision', 'planner', 'calendar', 'task', 'project', 'goal', 'journal', 'health', 'finance', 'inbox', 'automation', 'ai');--> statement-breakpoint
CREATE TABLE "timeline_days" (
	"date" date PRIMARY KEY NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"completion_score" integer DEFAULT 0 NOT NULL,
	"focus_minutes" integer DEFAULT 0 NOT NULL,
	"health_score" integer DEFAULT 0 NOT NULL,
	"journal_written" boolean DEFAULT false NOT NULL,
	"planner_accuracy" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"source_module" timeline_source NOT NULL,
	"entity_id" text,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"importance" integer DEFAULT 40 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"memory_type" "memory_type" DEFAULT 'milestone' NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"pinned" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_type" "snapshot_type" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timeline_memories" ADD CONSTRAINT "timeline_memories_event_id_timeline_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."timeline_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "timeline_events_timestamp_idx" ON "timeline_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "timeline_events_source_idx" ON "timeline_events" USING btree ("source_module");--> statement-breakpoint
CREATE INDEX "timeline_events_entity_idx" ON "timeline_events" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "timeline_memories_event_idx" ON "timeline_memories" USING btree ("event_id");