CREATE TYPE "public"."book_status" AS ENUM('want_to_read', 'reading', 'finished', 'abandoned', 'reference');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('enrolled', 'in_progress', 'completed', 'paused', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."flashcard_state" AS ENUM('new', 'learning', 'review', 'mastered');--> statement-breakpoint
CREATE TYPE "public"."knowledge_type" AS ENUM('note', 'wiki', 'book', 'course', 'research', 'flashcard_deck');--> statement-breakpoint
CREATE TYPE "public"."learning_status" AS ENUM('not_started', 'in_progress', 'completed', 'on_hold', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."knowledge_link_kind" AS ENUM('references', 'mentions', 'related', 'prerequisite', 'derived_from', 'belongs_to');--> statement-breakpoint
CREATE TYPE "public"."review_interval" AS ENUM('d1', 'd3', 'd7', 'd14', 'd30', 'd60', 'd120');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"status" "book_status" DEFAULT 'want_to_read' NOT NULL,
	"total_pages" integer DEFAULT 0 NOT NULL,
	"current_page" integer DEFAULT 0 NOT NULL,
	"rating" integer,
	"notes" text DEFAULT '' NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"minutes_read" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"provider" text DEFAULT '' NOT NULL,
	"status" "course_status" DEFAULT 'enrolled' NOT NULL,
	"total_modules" integer DEFAULT 0 NOT NULL,
	"completed_modules" integer DEFAULT 0 NOT NULL,
	"hours_spent" real DEFAULT 0 NOT NULL,
	"certificate" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"state" "flashcard_state" DEFAULT 'new' NOT NULL,
	"interval_step" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"source_type" "knowledge_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"target_type" "knowledge_type" NOT NULL,
	"kind" "knowledge_link_kind" DEFAULT 'references' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_titles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"grade" text NOT NULL,
	"from_state" "flashcard_state" NOT NULL,
	"to_state" "flashcard_state" NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"question" text DEFAULT '' NOT NULL,
	"hypothesis" text DEFAULT '' NOT NULL,
	"status" "learning_status" DEFAULT 'in_progress' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experiments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conclusions" text DEFAULT '' NOT NULL,
	"related_note_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_titles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_flashcard_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."flashcard_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_reviews" ADD CONSTRAINT "memory_reviews_card_id_flashcards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."flashcards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flashcards_deck_idx" ON "flashcards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcards_due_idx" ON "flashcards" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "knowledge_links_source_idx" ON "knowledge_links" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_links_target_idx" ON "knowledge_links" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "knowledge_notes_updated_idx" ON "knowledge_notes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "memory_reviews_reviewed_idx" ON "memory_reviews" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "memory_reviews_card_idx" ON "memory_reviews" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "wiki_pages_slug_idx" ON "wiki_pages" USING btree ("slug");