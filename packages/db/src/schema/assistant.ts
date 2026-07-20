/**
 * Conversational Chief of Staff schema (Sprint 5.3, Phase 5). Stores conversation state + AI config
 * only — never business entities (the assistant reads deterministic read models via tools and owns
 * no domain data). Six tables:
 *
 *   - ai_conversations       — a conversation thread (mode + rolling summary).
 *   - assistant_sessions     — one turn: the grounded message + provider + mode + tool trail.
 *   - conversation_summaries — periodic rolling summaries (context compression).
 *   - provider_credentials   — ENCRYPTED provider keys, server-side only, never returned via API.
 *   - conversation_feedback  — per-message feedback (helpful / proposal accepted-rejected).
 *   - assistant_modes        — per-mode config overrides (tools / provider capability / prompt).
 *
 * Single user (05 §0: no user_id).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** A conversation thread. */
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull().default("New conversation"),
    /** chief | planning | review | research | search | editing | automation | troubleshooting. */
    mode: text("mode").notNull().default("chief"),
    /** Rolling summary of older turns. */
    summary: text("summary").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byMode: index("ai_conversations_mode_idx").on(t.mode) }),
);

/** One assistant turn — the grounded message + tool trail + provider. */
export const assistantSessions = pgTable(
  "assistant_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").references(() => aiConversations.id, {
      onDelete: "cascade",
    }),
    role: text("role").notNull().default("assistant"),
    content: text("content").notNull().default(""),
    provider: text("provider").notNull().default("local"),
    mode: text("mode").notNull().default("chief"),
    grounded: boolean("grounded").notNull().default(false),
    unknownAnswer: boolean("unknown_answer").notNull().default(false),
    /** Tool-call trail (grounding evidence). */
    toolCalls: jsonb("tool_calls").$type<unknown[]>().notNull().default([]),
    /** Citations backing the answer. */
    citations: jsonb("citations").$type<unknown[]>().notNull().default([]),
    /** A proposal, when the turn asked to change data (never applied here). */
    proposal: jsonb("proposal"),
    latencyMs: real("latency_ms").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byConversation: index("assistant_sessions_conversation_idx").on(t.conversationId) }),
);

/** A periodic rolling summary snapshot (context compression). */
export const conversationSummaries = pgTable(
  "conversation_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").references(() => aiConversations.id, {
      onDelete: "cascade",
    }),
    summary: text("summary").notNull().default(""),
    foldedCount: integer("folded_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byConversation: index("conversation_summaries_conversation_idx").on(t.conversationId),
  }),
);

/**
 * Encrypted provider credentials (Sprint 5.3). Server-side ONLY — the ciphertext never leaves the
 * server, and the plaintext key is never stored here, logged, or returned via any API. The
 * preferred mechanism is env vars; this table exists for owners who set keys through the UI.
 */
export const providerCredentials = pgTable(
  "provider_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    /** AES-GCM ciphertext of the key (base64). Never plaintext. */
    ciphertext: text("ciphertext").notNull(),
    /** IV / nonce for the ciphertext (base64). */
    iv: text("iv").notNull(),
    /** Last 4 chars of the key, for display only. */
    hint: text("hint").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byProvider: index("provider_credentials_provider_idx").on(t.provider) }),
);

/** Per-message conversation feedback (learning signal; never changes deterministic logic). */
export const conversationFeedback = pgTable(
  "conversation_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => assistantSessions.id, { onDelete: "cascade" }),
    /** helpful | unhelpful | wrong | accepted_proposal | rejected_proposal. */
    outcome: text("outcome").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bySession: index("conversation_feedback_session_idx").on(t.sessionId) }),
);

/** Per-mode configuration overrides (tools / provider capability / prompt). Config only. */
export const assistantModes = pgTable("assistant_modes", {
  id: uuid("id").defaultRandom().primaryKey(),
  mode: text("mode").notNull(),
  tools: jsonb("tools").$type<string[]>().notNull().default([]),
  capability: text("capability").notNull().default("reasoning"),
  prompt: text("prompt").notNull().default("system.assistant"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
