CREATE TYPE "public"."theme_preference" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."time_format" AS ENUM('12h', '24h');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner');--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"preferred_currency" text DEFAULT 'INR' NOT NULL,
	"preferred_date_format" text DEFAULT 'dd MMM yyyy' NOT NULL,
	"preferred_time_format" time_format DEFAULT '12h' NOT NULL,
	"theme" "theme_preference" DEFAULT 'dark' NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"sidebar_width" integer DEFAULT 236 NOT NULL,
	"default_landing_page" text DEFAULT '/today' NOT NULL,
	"default_focus_duration" integer DEFAULT 25 NOT NULL,
	"preferred_start_of_day" text DEFAULT '06:00' NOT NULL,
	"preferred_end_of_day" text DEFAULT '22:00' NOT NULL,
	"notification_sound_enabled" boolean DEFAULT true NOT NULL,
	"desktop_notifications_enabled" boolean DEFAULT false NOT NULL,
	"mobile_notifications_enabled" boolean DEFAULT false NOT NULL,
	"auto_launch_morning_briefing" boolean DEFAULT false NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;