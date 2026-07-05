-- Runs once on first container init (empty data dir). Mirrors the idempotent
-- extension setup in packages/db/src/migrate.ts so the raw container and the
-- app agree. See 05_Database_Design.md §0 / §14.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
