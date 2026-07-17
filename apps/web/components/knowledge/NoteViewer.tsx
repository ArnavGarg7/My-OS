"use client";

import { Text } from "@myos/ui";
import type { Note } from "@myos/core/knowledge";
import { Tags } from "./Tags";

/**
 * NoteViewer (Sprint 4.1). Renders a permanent markdown note using the design system —
 * headings, paragraphs, code fences, lists and wiki links — without a heavy markdown
 * dependency. Deterministic line-based rendering.
 */
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let inFence = false;
  let fence: string[] = [];
  let list: string[] = [];

  const flushList = (key: number) => {
    if (list.length === 0) return;
    out.push(
      <ul key={`ul-${key}`} className="text-fg-muted ml-4 list-disc text-sm">
        {list.map((li, i) => (
          <li key={i}>{renderInline(li)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw;
    if (/^```/.test(line.trim())) {
      if (inFence) {
        out.push(
          <pre
            key={`code-${i}`}
            className="bg-surface-raised overflow-x-auto rounded-md p-3 text-xs"
          >
            <code>{fence.join("\n")}</code>
          </pre>,
        );
        fence = [];
        inFence = false;
      } else {
        flushList(i);
        inFence = true;
      }
      return;
    }
    if (inFence) {
      fence.push(line);
      return;
    }
    const h = /^(#{1,6})\s+(.+)$/.exec(line);
    if (h) {
      flushList(i);
      const level = h[1]!.length;
      out.push(
        <Text
          key={`h-${i}`}
          variant={level <= 2 ? "heading-s" : "body-m"}
          className="font-semibold"
        >
          {h[2]}
        </Text>,
      );
      return;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flushList(i);
    if (line.trim().length > 0) {
      out.push(
        <p key={`p-${i}`} className="text-fg-muted text-sm">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList(lines.length);
  return out;
}

/** Render inline wiki links + bold as spans. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return parts.map((p, i) => {
    const wiki = /^\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/.exec(p);
    if (wiki) {
      return (
        <span key={i} className="text-accent">
          {wiki[1]}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function NoteViewer({ note }: { note: Note }) {
  return (
    <article className="flex flex-col gap-3">
      <Text variant="heading-m">{note.title}</Text>
      <Tags tags={note.tags} />
      <div className="flex flex-col gap-2">{renderMarkdown(note.content)}</div>
    </article>
  );
}
