/**
 * Seeded category catalog for the guided record entry. Deterministic reference content (like the
 * exercise / goal / health-quicklog catalogs): a tappable menu of common spending + income categories,
 * each with a display label, an income/expense group and an icon key the UI resolves to a real icon.
 * Pure: no React, no icon imports, no IO. `id` is the plain lowercase string stored on the transaction
 * (compatible with the existing parser + budgets); everything stays editable — this is only a starting
 * menu, not fabricated data.
 */
export type CategoryGroup = "expense" | "income";

export interface CategoryDef {
  /** Stored verbatim on the transaction `category` field. */
  id: string;
  label: string;
  group: CategoryGroup;
  /** Icon key resolved by the UI layer (keeps core free of React/lucide). */
  icon: string;
}

export const CATEGORY_CATALOG: CategoryDef[] = [
  { id: "groceries", label: "Groceries", group: "expense", icon: "groceries" },
  { id: "dining", label: "Dining", group: "expense", icon: "dining" },
  { id: "transport", label: "Transport", group: "expense", icon: "transport" },
  { id: "housing", label: "Housing", group: "expense", icon: "housing" },
  { id: "utilities", label: "Utilities", group: "expense", icon: "utilities" },
  { id: "entertainment", label: "Entertainment", group: "expense", icon: "entertainment" },
  { id: "health", label: "Health", group: "expense", icon: "health" },
  { id: "shopping", label: "Shopping", group: "expense", icon: "shopping" },
  { id: "subscriptions", label: "Subscriptions", group: "expense", icon: "subscriptions" },
  { id: "education", label: "Education", group: "expense", icon: "education" },
  { id: "travel", label: "Travel", group: "expense", icon: "travel" },
  { id: "personal", label: "Personal", group: "expense", icon: "personal" },
  { id: "gifts", label: "Gifts", group: "expense", icon: "gifts" },
  { id: "other", label: "Other", group: "expense", icon: "other" },
  { id: "income", label: "Income", group: "income", icon: "income" },
  { id: "savings", label: "Savings", group: "income", icon: "savings" },
];

/** Categories in a given group (expense or income), in catalog order. */
export function categoriesForGroup(group: CategoryGroup): CategoryDef[] {
  return CATEGORY_CATALOG.filter((c) => c.group === group);
}

/** Look up a built-in category definition by its stored id (case-insensitive). */
export function findCategory(id: string): CategoryDef | undefined {
  const key = id.trim().toLowerCase();
  return CATEGORY_CATALOG.find((c) => c.id === key);
}

/** True if `id` is one of the built-in (non-custom) categories. */
export function isBuiltInCategory(id: string): boolean {
  return findCategory(id) !== undefined;
}

/**
 * The icon keys a custom category may choose from — the same set the built-in catalog uses, so every
 * category (seeded or custom) resolves to a real icon in the UI. Kept here so core validation and the UI
 * picker agree on the allowed values.
 */
export const CATEGORY_ICON_KEYS: string[] = [
  "groceries",
  "dining",
  "transport",
  "housing",
  "utilities",
  "entertainment",
  "health",
  "shopping",
  "subscriptions",
  "education",
  "travel",
  "personal",
  "gifts",
  "income",
  "savings",
  "other",
];

/**
 * A user-defined category. `id` is a slug stored verbatim on the transaction (like a built-in id), so
 * budgets + analysis group by it directly. Persisted; built-ins are code-only.
 */
export interface CustomCategory {
  id: string;
  label: string;
  group: CategoryGroup;
  icon: string;
  color: string;
  archived: boolean;
}

/**
 * Turn a free-text category name into a stable slug id: lowercase, alphanumerics kept, everything else
 * collapsed to single hyphens, trimmed. Deterministic. Returns "" for names with no usable characters
 * (the service treats that as invalid).
 */
export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
