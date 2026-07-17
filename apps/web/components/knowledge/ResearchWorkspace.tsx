"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Text } from "@myos/ui";
import { FlaskConical } from "lucide-react";
import type { ResearchProject } from "@myos/core/knowledge";
import { LEARNING_STATUS_LABEL } from "./knowledge-icons";

/**
 * ResearchWorkspace (Sprint 4.1). Long-running investigations — question, hypothesis,
 * sources, experiments and conclusions. A "research.created" timeline event fires on add.
 */
export function ResearchWorkspace({
  research,
  onAdd,
}: {
  research: ResearchProject[];
  onAdd: (input: { title: string; question?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Research question title…"
          aria-label="Research title"
        />
        <div className="flex items-end gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What are you investigating?"
            aria-label="Research question"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (!title.trim()) return;
              onAdd({
                title: title.trim(),
                ...(question.trim() ? { question: question.trim() } : {}),
              });
              setTitle("");
              setQuestion("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
      {research.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No research yet"
          description="Start a long-running investigation."
        />
      ) : (
        research.map((r) => (
          <Card key={r.id} className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <Text variant="body-m">{r.title}</Text>
              <Badge size="sm" variant="neutral">
                {LEARNING_STATUS_LABEL[r.status]}
              </Badge>
            </div>
            {r.question ? (
              <Text variant="caption" tone="subtle">
                Q: {r.question}
              </Text>
            ) : null}
            {r.sources.length > 0 ? (
              <Text variant="caption" tone="subtle">
                {r.sources.length} source(s)
              </Text>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
