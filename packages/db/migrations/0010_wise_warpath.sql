CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."recovery_status" AS ENUM('recovered', 'recovering', 'fatigued', 'overtrained');--> statement-breakpoint
CREATE TYPE "public"."workout_type" AS ENUM('strength', 'cardio', 'mobility', 'sport', 'walk', 'other');--> statement-breakpoint
CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weight" double precision,
	"body_fat" double precision,
	"muscle_mass" double precision,
	"waist" double precision,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_daily" (
	"date" date PRIMARY KEY NOT NULL,
	"energy_level" "energy_level",
	"mood" text,
	"stress" integer,
	"sleep_score" integer,
	"readiness_score" integer,
	"water_ml" integer DEFAULT 0 NOT NULL,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"steps" integer DEFAULT 0 NOT NULL,
	"weight" double precision,
	"body_fat" double precision,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hydration_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time" timestamp with time zone DEFAULT now() NOT NULL,
	"amount_ml" integer NOT NULL,
	"source" text DEFAULT 'water' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal" "meal_type" NOT NULL,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sleep_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bed_time" timestamp with time zone NOT NULL,
	"wake_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"quality" integer DEFAULT 70 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "workout_type" DEFAULT 'other' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"volume" double precision DEFAULT 0 NOT NULL,
	"calories_burned" integer DEFAULT 0 NOT NULL,
	"rpe" integer,
	"completed" boolean DEFAULT false NOT NULL
);
