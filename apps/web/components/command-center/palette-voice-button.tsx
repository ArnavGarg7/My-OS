"use client";

import { Mic, MicOff } from "lucide-react";
import { useVoice } from "@/lib/interaction/use-voice";

/**
 * Voice entry for the Omni Launcher (Stage 9). Speaking fills the palette query, which then
 * flows through the SAME interpretation path as typing — no voice-only feature. Honest
 * states: hidden/disabled when the browser can't do speech; a listening indicator otherwise.
 * Voice is never required (typing always works).
 */
export function PaletteVoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const voice = useVoice(onTranscript);

  if (!voice.supported) {
    return (
      <span title="Voice input isn't supported in this browser" className="text-fg-subtle/50">
        <MicOff size={16} aria-hidden />
      </span>
    );
  }

  const listening = voice.state === "listening";
  return (
    <button
      type="button"
      onClick={() => (listening ? voice.stop() : voice.start())}
      aria-label={listening ? "Stop listening" : "Start voice input"}
      aria-pressed={listening}
      className={`flex size-7 items-center justify-center rounded-md ${
        listening
          ? "bg-accent text-on-accent animate-pulse"
          : "text-fg-subtle hover:text-fg hover:bg-elevated"
      }`}
      title={
        voice.state === "error"
          ? "Voice failed — try again"
          : listening
            ? "Listening…"
            : "Voice input"
      }
    >
      <Mic size={15} aria-hidden />
    </button>
  );
}
