CREATE TYPE "public"."delivery_channel" AS ENUM('banner', 'toast', 'persistent', 'silent', 'desktop', 'push', 'sound');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('critical', 'high', 'medium', 'low', 'silent');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('generated', 'scheduled', 'delivered', 'seen', 'snoozed', 'completed', 'archived', 'dismissed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('reminder', 'alert', 'information', 'warning', 'success', 'system', 'health', 'calendar', 'planner', 'finance', 'goals', 'projects', 'focus');--> statement-breakpoint
CREATE TABLE "notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"status" "notification_status" NOT NULL,
	"note" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" text DEFAULT '22:00' NOT NULL,
	"quiet_hours_end" text DEFAULT '07:00' NOT NULL,
	"working_hours_only" boolean DEFAULT false NOT NULL,
	"weekend_suppression" boolean DEFAULT false NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"deliver_at" timestamp with time zone NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'medium' NOT NULL,
	"status" "notification_status" DEFAULT 'generated' NOT NULL,
	"title" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"source" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"trigger" text DEFAULT '' NOT NULL,
	"condition" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_href" text,
	"scheduled_for" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"snooze_count" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"escalation" text DEFAULT 'silent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_history_notif_idx" ON "notification_history" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_queue_deliver_idx" ON "notification_queue" USING btree ("deliver_at");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_dedupe_idx" ON "notifications" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notifications_source_idx" ON "notifications" USING btree ("source");