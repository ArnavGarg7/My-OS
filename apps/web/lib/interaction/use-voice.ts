"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice input (Stage 9). A thin wrapper over the browser Web Speech API — no audio is ever
 * stored or sent to a server; only the final transcript text is surfaced (which then flows
 * through the same text-interpretation path). Honest states: `unsupported` when the browser
 * lacks the API, `error` on failure. Voice is never required — every action has a
 * keyboard/mouse path. This is an interface, not a source of truth.
 */
export type VoiceState = "unsupported" | "idle" | "listening" | "error";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function useVoice(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  useEffect(() => {
    const rec = getRecognition();
    if (!rec) {
      setState("unsupported");
      return;
    }
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(text);
      const last = e.results[e.results.length - 1] as unknown as { isFinal?: boolean };
      if (last?.isFinal && text) cbRef.current(text);
    };
    rec.onerror = () => setState("error");
    rec.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setTranscript("");
    try {
      rec.start();
      setState("listening");
    } catch {
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  return { state, transcript, start, stop, supported: state !== "unsupported" };
}
