CREATE TYPE "public"."assignment_status" AS ENUM('todo', 'in_progress', 'submitted', 'graded');--> statement-breakpoint
CREATE TYPE "public"."class_kind" AS ENUM('lecture', 'lab', 'tutorial', 'seminar', 'other');--> statement-breakpoint
CREATE TYPE "public"."internship_entry_kind" AS ENUM('work', 'meeting', 'learning', 'deliverable');--> statement-breakpoint
CREATE TYPE "public"."target_status" AS ENUM('planned', 'active', 'hit', 'missed', 'archived');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid,
	"title" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"due_at" timestamp with time zone,
	"status" "assignment_status" DEFAULT 'todo' NOT NULL,
	"grade" text DEFAULT '' NOT NULL,
	"weight" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"kind" "class_kind" DEFAULT 'lecture' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"instructor" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '' NOT NULL,
	"term" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid,
	"title" text NOT NULL,
	"exam_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"location" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internship_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_date" date NOT NULL,
	"title" text NOT NULL,
	"kind" "internship_entry_kind" DEFAULT 'work' NOT NULL,
	"hours" double precision DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"target_date" date NOT NULL,
	"surface_from" date,
	"category" text DEFAULT 'personal' NOT NULL,
	"status" "target_status" DEFAULT 'planned' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_college_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."college_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_course_id_college_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."college_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_course_id_college_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."college_courses"("id") ON DELETE set null ON UPDATE no action;