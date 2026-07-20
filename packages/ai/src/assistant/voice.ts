/**
 * Voice-ready infrastructure (Sprint 5.3). NOT full voice — just the seams: a streaming-friendly
 * turn interface plus a pluggable VoiceAdapter for speech-in/speech-out to attach later. Introduces
 * NO business logic. Pure interfaces + a no-op adapter.
 */

export interface VoiceAdapter {
  /** Convert audio to text (returns null when unsupported). */
  transcribe(audio: ArrayBuffer): Promise<string | null>;
  /** Convert assistant text to speech (returns null when unsupported). */
  synthesize(text: string): Promise<ArrayBuffer | null>;
  /** Whether the adapter supports barge-in / interruptions. */
  readonly supportsInterruption: boolean;
}

/** The default no-op adapter — voice disabled, everything falls back to text. */
export const noopVoiceAdapter: VoiceAdapter = {
  async transcribe() {
    return null;
  },
  async synthesize() {
    return null;
  },
  supportsInterruption: false,
};
