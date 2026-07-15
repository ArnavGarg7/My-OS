CREATE TYPE "public"."availability_type" AS ENUM('working', 'meeting', 'break', 'busy', 'available', 'focus', 'personal');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_status" AS ENUM('confirmed', 'tentative', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."calendar_provider" AS ENUM('local', 'google', 'outlook', 'apple', 'ics');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('idle', 'running', 'success', 'error');--> statement-breakpoint
CREATE TABLE "availability_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"type" "availability_type" DEFAULT 'working' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"calendar_id" uuid NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"status" "calendar_event_status" DEFAULT 'confirmed' NOT NULL,
	"source" "calendar_provider" DEFAULT 'local' NOT NULL,
	"recurrence_rule" jsonb,
	"recurrence_parent" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "calendar_provider" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "sync_status" DEFAULT 'idle' NOT NULL,
	"events_imported" integer DEFAULT 0 NOT NULL,
	"events_updated" integer DEFAULT 0 NOT NULL,
	"events_deleted" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'blue' NOT NULL,
	"provider" "calendar_provider" DEFAULT 'local' NOT NULL,
	"primary" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;