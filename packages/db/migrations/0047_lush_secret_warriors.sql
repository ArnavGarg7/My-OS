CREATE TABLE "nutrition_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calorie_target" integer DEFAULT 2000 NOT NULL,
	"protein_target" double precision DEFAULT 120 NOT NULL,
	"carbs_target" double precision DEFAULT 220 NOT NULL,
	"fat_target" double precision DEFAULT 70 NOT NULL,
	"water_ml_target" integer DEFAULT 2500 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "brand" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "quantity" double precision;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "unit" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "fiber" double precision;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "sugar" double precision;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "sodium" double precision;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "source_ref" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "planned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD COLUMN "consumed_on" date;