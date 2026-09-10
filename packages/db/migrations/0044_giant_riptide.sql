ALTER TYPE "public"."action_kind" ADD VALUE 'create_task' BEFORE 'noop';--> statement-breakpoint
ALTER TYPE "public"."trigger_kind" ADD VALUE 'connector';