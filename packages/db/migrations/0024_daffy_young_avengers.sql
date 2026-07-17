CREATE TYPE "public"."exercise_type" AS ENUM('strength', 'cardio', 'mobility', 'sport', 'recovery');--> statement-breakpoint
CREATE TYPE "public"."injury_status" AS ENUM('active', 'recovering', 'healed');--> statement-breakpoint
CREATE TYPE "public"."life_habit_frequency" AS ENUM('daily', 'weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."medication_frequency" AS ENUM('once_daily', 'twice_daily', 'thrice_daily', 'weekly', 'as_needed');--> statement-breakpoint
CREATE TYPE "public"."review_frequency" AS ENUM('weekly', 'monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."routine_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."routine_type" AS ENUM('morning', 'evening', 'workout', 'study', 'travel', 'weekend', 'custom');--> statement-breakpoint
CREATE TABLE "doctor_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"provider" text DEFAULT '' NOT NULL,
	"date" date NOT NULL,
	"time" text,
	"location" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "exercise_type" DEFAULT 'strength' NOT NULL,
	"muscle_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"date" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "injury_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"body_part" text DEFAULT '' NOT NULL,
	"status" "injury_status" DEFAULT 'active' NOT NULL,
	"severity" integer DEFAULT 1 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"healed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "life_body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"weight_kg" real,
	"body_fat_percentage" real,
	"resting_heart_rate" integer,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "life_habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"frequency" "life_habit_frequency" DEFAULT 'daily' NOT NULL,
	"target" integer DEFAULT 1 NOT NULL,
	"days_of_week" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"goal_id" uuid,
	"knowledge_note_id" uuid,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"dosage" text DEFAULT '' NOT NULL,
	"frequency" "medication_frequency" DEFAULT 'once_daily' NOT NULL,
	"time_of_day" text,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"frequency" "review_frequency" NOT NULL,
	"period_start" date NOT NULL,
	"wins" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lessons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"focus_next" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"date" date NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"step_order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"linked_task_id" uuid,
	"linked_habit_id" uuid
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "routine_type" DEFAULT 'custom' NOT NULL,
	"status" "routine_status" DEFAULT 'active' NOT NULL,
	"start_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"dosage" text DEFAULT '' NOT NULL,
	"frequency" "medication_frequency" DEFAULT 'once_daily' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vision_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"statement" text NOT NULL,
	"is_identity" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"exercise_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid,
	"date" date NOT NULL,
	"sets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"perceived_exertion" integer DEFAULT 5 NOT NULL,
	"recovery_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "body_fat_percentage" double precision;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "resting_heart_rate" integer;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "workout_program_id" uuid;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "exercise_id" uuid;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "recovery_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "perceived_exertion" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "parent_goal" uuid;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "vision_category" text;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "review_frequency" text;--> statement-breakpoint
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_life_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."life_habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_completions" ADD CONSTRAINT "routine_completions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doctor_appointments_date_idx" ON "doctor_appointments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "habit_completions_habit_idx" ON "habit_completions" USING btree ("habit_id");--> statement-breakpoint
CREATE INDEX "habit_completions_date_idx" ON "habit_completions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "life_body_measurements_date_idx" ON "life_body_measurements" USING btree ("date");--> statement-breakpoint
CREATE INDEX "life_habits_archived_idx" ON "life_habits" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "medication_logs_med_idx" ON "medication_logs" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "routine_completions_routine_idx" ON "routine_completions" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "routine_steps_routine_idx" ON "routine_steps" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_date_idx" ON "workout_sessions" USING btree ("date");