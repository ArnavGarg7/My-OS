CREATE TABLE "finance_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"category_group" text DEFAULT 'expense' NOT NULL,
	"icon" text DEFAULT 'other' NOT NULL,
	"color" text DEFAULT '' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;