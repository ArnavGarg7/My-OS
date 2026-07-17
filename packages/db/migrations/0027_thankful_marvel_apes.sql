CREATE TYPE "public"."asset_type" AS ENUM('electronics', 'furniture', 'jewelry', 'equipment', 'property', 'collection', 'digital', 'vehicle');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('passport', 'driving_license', 'pan', 'aadhaar', 'certificate', 'medical', 'insurance', 'property', 'tax', 'academic');--> statement-breakpoint
CREATE TYPE "public"."insurance_type" AS ENUM('health', 'life', 'vehicle', 'home', 'travel', 'device');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('call', 'meeting', 'email', 'message', 'coffee', 'conference', 'travel', 'gift', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."investment_type" AS ENUM('stock', 'etf', 'mutual_fund', 'bond', 'crypto', 'fixed_deposit', 'gold', 'real_estate');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'overdue', 'completed');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('friend', 'family', 'mentor', 'professor', 'colleague', 'manager', 'recruiter', 'investor', 'networking');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('car', 'motorcycle', 'scooter', 'bicycle', 'other');--> statement-breakpoint
CREATE TABLE "asset_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"title" text NOT NULL,
	"due_at" date NOT NULL,
	"completed_at" timestamp with time zone,
	"cost" double precision DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "asset_type" DEFAULT 'electronics' NOT NULL,
	"purchase_price" double precision DEFAULT 0 NOT NULL,
	"purchased_at" date NOT NULL,
	"current_value" double precision,
	"depreciation_rate" double precision,
	"warranty_expires_at" date,
	"serial_number" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"room" text DEFAULT '' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_value" double precision DEFAULT 0 NOT NULL,
	"asset_id" uuid,
	"notes" text DEFAULT '' NOT NULL,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "important_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "document_type" DEFAULT 'certificate' NOT NULL,
	"document_number" text DEFAULT '' NOT NULL,
	"issued_at" date,
	"expires_at" date,
	"issuer" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "insurance_type" DEFAULT 'health' NOT NULL,
	"provider" text DEFAULT '' NOT NULL,
	"policy_number" text DEFAULT '' NOT NULL,
	"coverage_amount" double precision DEFAULT 0 NOT NULL,
	"premium" double precision DEFAULT 0 NOT NULL,
	"premium_interval_months" integer DEFAULT 12 NOT NULL,
	"starts_at" date NOT NULL,
	"expires_at" date NOT NULL,
	"beneficiaries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"claims" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"asset_id" uuid,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"institution" text DEFAULT '' NOT NULL,
	"finance_account_id" uuid,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"type" "investment_type" DEFAULT 'stock' NOT NULL,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"average_cost" double precision DEFAULT 0 NOT NULL,
	"current_price" double precision DEFAULT 0 NOT NULL,
	"priced_at" timestamp with time zone,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"direction" text DEFAULT 'buy' NOT NULL,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"fees" double precision DEFAULT 0 NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'conference' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"type" "interaction_type" DEFAULT 'message' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "relationship_type" DEFAULT 'friend' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"birthday" text,
	"anniversary" text,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"next_follow_up_at" date,
	"knowledge_note_id" uuid,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"frequency" text DEFAULT 'quarterly' NOT NULL,
	"period_start" date NOT NULL,
	"net_worth" double precision DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'passport' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"issued_at" date,
	"expires_at" date,
	"notes" text DEFAULT '' NOT NULL,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "vehicle_type" DEFAULT 'car' NOT NULL,
	"registration_number" text DEFAULT '' NOT NULL,
	"asset_id" uuid,
	"odometer" double precision DEFAULT 0 NOT NULL,
	"registration_expires_at" date,
	"pollution_expires_at" date,
	"insurance_policy_id" uuid,
	"notes" text DEFAULT '' NOT NULL,
	"knowledge_note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "investment_account_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "asset_id" uuid;--> statement-breakpoint
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_inventory" ADD CONSTRAINT "home_inventory_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_positions" ADD CONSTRAINT "investment_positions_account_id_investment_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."investment_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_position_id_investment_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."investment_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_events" ADD CONSTRAINT "relationship_events_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_interactions" ADD CONSTRAINT "relationship_interactions_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_maintenance_asset_idx" ON "asset_maintenance" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_due_idx" ON "asset_maintenance" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "assets_type_idx" ON "assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "home_inventory_room_idx" ON "home_inventory" USING btree ("room");--> statement-breakpoint
CREATE INDEX "important_documents_expires_idx" ON "important_documents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "insurance_policies_expires_idx" ON "insurance_policies" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "investment_positions_account_idx" ON "investment_positions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "investment_transactions_position_idx" ON "investment_transactions" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "relationship_events_relationship_idx" ON "relationship_events" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "relationship_interactions_relationship_idx" ON "relationship_interactions" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "relationship_interactions_occurred_idx" ON "relationship_interactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "relationships_archived_idx" ON "relationships" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "travel_documents_expires_idx" ON "travel_documents" USING btree ("expires_at");