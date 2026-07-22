/**
 * Explainability (Sprint 6.5, spec §Explainability). Turns any learned value into a plain-language
 * explanation grounded in its evidence + confidence — "Nothing becomes black box." Pure — no AI. Used
 * by the Evidence Viewer and the Chief when it cites why it personalized something.
 */
import type { Confidence, Evidence, Preference } from "./types";

export interface Explanation {
  summary: string;
  confidence: Confidence;
  evidence: Evidence;
  editable: true;
}

/** Explain a learned preference. */
export function explainPreference(p: Preference): Explanation {
  const src = p.source === "explicit" ? "you told the OS" : "the OS observed";
  return {
    summary: `Learned "${p.key} = ${p.value}" because ${src} this across ${p.evidence.observations} observations over ${p.evidence.timeSpanDays} days (${p.confidence.level.replace("_", " ")} confidence). You can edit or disable this.`,
    confidence: p.confidence,
    evidence: p.evidence,
    editable: true,
  };
}

/** A short confidence caption, e.g. "High · 82%". */
export function confidenceCaption(c: Confidence): string {
  if (c.level === "unknown") return "Unknown";
  return `${cap(c.level.replace("_", " "))} · ${Math.round(c.score * 100)}%`;
}

function cap(s: string): string {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}
