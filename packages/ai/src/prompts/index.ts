/**
 * @myos/ai/prompts — versioned, immutable prompt assets loaded centrally (06_AI_Architecture §13).
 */
export { getPrompt, listPrompts, isModelCompatible, type PromptAsset } from "./registry";
export {
  toVersionRecord,
  seedVersionRecords,
  validatePrompt,
  comparePrompts,
  applyRollback,
  activeVersion,
  type PromptVersionRecord,
  type PromptStatus,
  type PromptValidationIssue,
  type PromptDiff,
} from "./lifecycle";
