CREATE TABLE "sync_mutations" (
	"client_mutation_id" text PRIMARY KEY NOT NULL,
	"op" text NOT NULL,
	"status" text DEFAULT 'succeeded' NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
