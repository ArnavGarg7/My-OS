CREATE TYPE "public"."capture_source" AS ENUM('quick_add', 'command_center', 'share', 'manual', 'import', 'drag_drop', 'paste');--> statement-breakpoint
CREATE TYPE "public"."capture_status" AS ENUM('new', 'organized', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."capture_type" AS ENUM('text', 'task', 'note', 'idea', 'decision_note', 'meeting', 'url', 'image', 'pdf', 'voice', 'file', 'journal', 'clipboard');--> statement-breakpoint
CREATE TABLE "inbox_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "capture_type" DEFAULT 'text' NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "capture_status" DEFAULT 'new' NOT NULL,
	"source" "capture_source" DEFAULT 'quick_add' NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organized_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
