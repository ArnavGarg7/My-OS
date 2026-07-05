import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema/index";

export * as schema from "./schema/index";
export type Schema = typeof schema;
export type Database = PostgresJsDatabase<Schema>;

export interface DbHandle {
  readonly db: Database;
  readonly sql: Sql;
  close: () => Promise<void>;
}

/**
 * Create a pooled database handle. Pool sizes per 04_System_Architecture.md §9
 * (web max 10, worker max 5). `prepare: false` keeps compatibility with
 * connection poolers and simplifies the single-user deployment.
 */
export function createDb(connectionString: string, opts: { max?: number } = {}): DbHandle {
  const sql = postgres(connectionString, {
    max: opts.max ?? 10,
    prepare: false,
    onnotice: () => {},
  });
  const db = drizzle(sql, { schema });
  return {
    db,
    sql,
    close: () => sql.end(),
  };
}
