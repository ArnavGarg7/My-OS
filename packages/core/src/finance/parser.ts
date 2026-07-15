import type { Category, TransactionDirection } from "./constants";

/**
 * Transaction parser (Sprint 2.11). Deterministic natural-language parsing of a
 * short entry into amount + direction + category + merchant. No AI.
 * "Spent 450 on groceries" → expense 450, groceries.
 */
export interface ParsedTransaction {
  amount: number;
  direction: TransactionDirection;
  category: Category;
  merchant: string;
}

const INCOME_WORDS = ["earned", "received", "got paid", "salary", "income", "refund", "deposited"];
const EXPENSE_WORDS = ["spent", "paid", "bought", "purchased"];

const CATEGORY_WORDS: Record<string, Category> = {
  grocery: "groceries",
  groceries: "groceries",
  food: "dining",
  dinner: "dining",
  lunch: "dining",
  restaurant: "dining",
  coffee: "dining",
  uber: "transport",
  taxi: "transport",
  fuel: "transport",
  petrol: "transport",
  gas: "transport",
  rent: "housing",
  mortgage: "housing",
  electricity: "utilities",
  water: "utilities",
  internet: "utilities",
  phone: "utilities",
  movie: "entertainment",
  game: "entertainment",
  netflix: "subscriptions",
  spotify: "subscriptions",
  doctor: "health",
  pharmacy: "health",
  gym: "health",
  clothes: "shopping",
  amazon: "shopping",
  salary: "income",
};

/** Parse a numeric amount, ignoring currency symbols and thousands separators. */
export function parseAmount(text: string): number {
  const m = text.replace(/[,₹$€£]/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]!) : 0;
}

export function parseTransaction(input: string): ParsedTransaction {
  const lower = input.toLowerCase();
  const amount = parseAmount(lower);

  let direction: TransactionDirection = "expense";
  if (INCOME_WORDS.some((w) => lower.includes(w))) direction = "income";
  else if (EXPENSE_WORDS.some((w) => lower.includes(w))) direction = "expense";

  let category: Category = direction === "income" ? "income" : "other";
  for (const [word, cat] of Object.entries(CATEGORY_WORDS)) {
    if (lower.includes(word)) {
      category = cat;
      break;
    }
  }

  // Merchant: text after "on"/"at"/"to" up to end, cleaned of the amount.
  const merchantMatch = input.match(/\b(?:on|at|to|from)\s+([A-Za-z][\w &'-]*)/i);
  const merchant = merchantMatch ? merchantMatch[1]!.trim() : "";

  return { amount, direction, category, merchant };
}
