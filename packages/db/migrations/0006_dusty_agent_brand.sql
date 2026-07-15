CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'blocked', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "recurring_tasks" (
	"task_id" uuid PRIMARY KEY NOT NULL,
	"frequency" "recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"next_occurrence" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	CONSTRAINT "task_dependencies_task_id_depends_on_task_id_pk" PRIMARY KEY("task_id","depends_on_task_id")
);
--> statement-breakpoint
CREATE TABLE "task_label_map" (
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "task_label_map_task_id_label_id_pk" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'gray' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"estimated_minutes" integer,
	"actual_minutes" integer,
	"due_at" timestamp with time zone,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"parent_task_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_label_map" ADD CONSTRAINT "task_label_map_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_label_map" ADD CONSTRAINT "task_label_map_label_id_task_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."task_labels"("id") ON DELETE cascade ON UPDATE no action;