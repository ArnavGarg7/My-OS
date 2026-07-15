"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Input, Text } from "@myos/ui";

/**
 * HealthQuickLog (Sprint 2.9). A natural-language quick-log box — "drank 500ml",
 * "ran 30 min", "slept 7h30". Parsing is deterministic (@myos/core/health).
 */
export function HealthQuickLog({ onLog }: { onLog: (text: string) => boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    const ok = onLog(text.trim());
    if (ok) {
      setText("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(false);
          }}
          placeholder="Quick log — e.g. drank 500ml, ran 30 min…"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          aria-label="Quick health log"
        />
        <Button variant="secondary" onClick={submit} disabled={!text.trim()}>
          <Sparkles size={14} aria-hidden />
          Log
        </Button>
      </div>
      {error && (
        <Text variant="caption" tone="danger">
          Couldn't understand that — try "drank 500ml" or "ran 30 min".
        </Text>
      )}
    </div>
  );
}
