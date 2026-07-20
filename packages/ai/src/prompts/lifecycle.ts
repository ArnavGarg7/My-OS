/**
 * Prompt lifecycle management (Sprint 5.4, 06_AI_Architecture §13). Prompts are first-class,
 * versioned assets: each version carries a changelog and an active/rolled-back status, versions can
 * be compared and validated, and rollback selects an earlier version as active — all WITHOUT code
 * changes (the server persists version records to `ai_prompt_versions`). Pure functions over version
 * records; the built-in registry ([[registry]]) supplies the immutable templates.
 */
import type { PromptAsset } from "./registry";
import { getPrompt, listPrompts } from "./registry";

export type PromptStatus = "active" | "rolled_back" | "draft";

/** A persisted, lifecycle-managed prompt version. */
export interface PromptVersionRecord {
  name: string;
  version: string;
  owner: string;
  purpose: string;
  compatibleModels: string[];
  requiredTools: string[];
  template: string;
  changelog: string;
  status: PromptStatus;
}

/** Build a version record from a registry asset (defaults for lifecycle-only fields). */
export function toVersionRecord(
  asset: PromptAsset,
  extra?: { purpose?: string; requiredTools?: string[]; changelog?: string; status?: PromptStatus },
): PromptVersionRecord {
  return {
    name: asset.metadata.name,
    version: asset.metadata.version,
    owner: asset.metadata.owner,
    purpose: extra?.purpose ?? asset.metadata.name.replace(/\./g, " "),
    compatibleModels: asset.metadata.compatibleModels,
    requiredTools: extra?.requiredTools ?? [],
    template: asset.template,
    changelog: extra?.changelog ?? "initial version",
    status: extra?.status ?? "active",
  };
}

/** Every registry prompt as a lifecycle version record (seed set). */
export function seedVersionRecords(): PromptVersionRecord[] {
  return listPrompts().map((meta) => {
    const asset = getPrompt(meta.name, meta.version);
    // asset is always present (meta came from the same registry)
    return toVersionRecord(asset as PromptAsset);
  });
}

export interface PromptValidationIssue {
  code:
    | "empty_template"
    | "missing_owner"
    | "no_compatible_models"
    | "contains_interpolation"
    | "too_long";
  message: string;
}

/** Validate a version record's template + metadata. Empty issues → valid. */
export function validatePrompt(record: PromptVersionRecord): PromptValidationIssue[] {
  const issues: PromptValidationIssue[] = [];
  if (record.template.trim().length === 0)
    issues.push({ code: "empty_template", message: "template is empty" });
  if (record.owner.trim().length === 0)
    issues.push({ code: "missing_owner", message: "owner is required" });
  if (record.compatibleModels.length === 0)
    issues.push({ code: "no_compatible_models", message: "declare at least one compatible model" });
  if (/\{\{.*?\}\}|\$\{.*?\}/.test(record.template))
    issues.push({
      code: "contains_interpolation",
      message: "prompt must be a frozen prefix-stable string (no interpolation)",
    });
  if (record.template.length > 8000)
    issues.push({ code: "too_long", message: "template exceeds 8000 chars" });
  return issues;
}

export interface PromptDiff {
  name: string;
  fromVersion: string;
  toVersion: string;
  templateChanged: boolean;
  modelsAdded: string[];
  modelsRemoved: string[];
  toolsAdded: string[];
  toolsRemoved: string[];
}

/** Compare two version records of the same prompt. */
export function comparePrompts(a: PromptVersionRecord, b: PromptVersionRecord): PromptDiff {
  const setDiff = (from: string[], to: string[]) => ({
    added: to.filter((x) => !from.includes(x)),
    removed: from.filter((x) => !to.includes(x)),
  });
  const models = setDiff(a.compatibleModels, b.compatibleModels);
  const tools = setDiff(a.requiredTools, b.requiredTools);
  return {
    name: a.name,
    fromVersion: a.version,
    toVersion: b.version,
    templateChanged: a.template !== b.template,
    modelsAdded: models.added,
    modelsRemoved: models.removed,
    toolsAdded: tools.added,
    toolsRemoved: tools.removed,
  };
}

/**
 * Resolve which version of a prompt is active after applying a rollback to `targetVersion`. Marks
 * the target active and any later version rolled_back. Pure — returns a new array.
 */
export function applyRollback(
  records: readonly PromptVersionRecord[],
  name: string,
  targetVersion: string,
): PromptVersionRecord[] {
  const target = records.find((r) => r.name === name && r.version === targetVersion);
  if (!target) return [...records];
  return records.map((r) => {
    if (r.name !== name) return r;
    if (r.version === targetVersion) return { ...r, status: "active" };
    // Any other version of this prompt becomes rolled_back (only one active at a time).
    return { ...r, status: "rolled_back" };
  });
}

/** The currently active version record for a prompt, if any. */
export function activeVersion(
  records: readonly PromptVersionRecord[],
  name: string,
): PromptVersionRecord | null {
  return records.find((r) => r.name === name && r.status === "active") ?? null;
}
