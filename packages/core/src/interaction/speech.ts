/**
 * Proactive → voice seam (Stage 9). PURE. Turns an existing proactive intervention (Stage 6)
 * into a voice-ready utterance + its action — the foundation a future voice assistant uses to
 * SPEAK an intervention. It creates NO new proactive engine and holds NO scheduling: the
 * Stage 6 evaluator still decides IF/WHEN, respecting proactive_enabled + quiet hours; this
 * only phrases what was already decided. Deterministic, grounded — no invented urgency.
 */
export interface VoiceReadyIntervention {
  utterance: string;
  action: { kind: string; label: string } | null;
}

export function interventionSpeech(intervention: {
  title: string;
  reason?: string | null;
  action?: { kind: string; label: string } | null;
}): VoiceReadyIntervention {
  const ask = intervention.action ? ` Want me to ${intervention.action.label.toLowerCase()}?` : "";
  const because = intervention.reason ? ` ${intervention.reason}` : "";
  return {
    utterance: `${intervention.title}.${because}${ask}`.trim(),
    action: intervention.action ?? null,
  };
}
