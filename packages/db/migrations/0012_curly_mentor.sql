CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'cash', 'credit', 'investment');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."transaction_direction" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" DEFAULT 'checking' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"opening_balance" double precision DEFAULT 0 NOT NULL,
	"institution" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"monthly_limit" double precision NOT NULL,
	"warning_threshold" double precision DEFAULT 0.8 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"target_amount" double precision NOT NULL,
	"current_amount" double precision DEFAULT 0 NOT NULL,
	"deadline" date,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"amount" double precision NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
	"next_payment" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"direction" "transaction_direction" DEFAULT 'expense' NOT NULL,
	"merchant" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"project_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;