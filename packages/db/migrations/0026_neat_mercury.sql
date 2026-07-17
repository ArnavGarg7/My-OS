ALTER TABLE "injury_log" ADD COLUMN "knowledge_note_id" uuid;--> statement-breakpoint
ALTER TABLE "personal_reviews" ADD COLUMN "knowledge_note_id" uuid;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "knowledge_note_id" uuid;--> statement-breakpoint
ALTER TABLE "vision_items" ADD COLUMN "knowledge_note_id" uuid;--> statement-breakpoint
ALTER TABLE "workout_programs" ADD COLUMN "knowledge_note_id" uuid;