"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button, MonoLabel, Text } from "@myos/ui";
import type { ConversationSubject } from "@myos/core/collaboration";
import { trpc } from "@/lib/trpc/client";
import { useCollaborationStream } from "@/lib/collaboration/use-collaboration-stream";

/**
 * DiscussionPanel (Stage 7). The object-attached conversation UI — reused on tasks,
 * projects and decisions so communication happens AROUND the work, not beside it. Real,
 * durable, server-authorized messages with @mentions (which create real notifications) and
 * live updates via the realtime seam. Kinetic Obsidian throughout; not a chat app.
 */
export function DiscussionPanel({
  subjectType,
  subjectId,
  subjectLabel,
  compact = false,
}: {
  subjectType: ConversationSubject;
  subjectId: string;
  subjectLabel: string;
  compact?: boolean;
}) {
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  useCollaborationStream();

  const query = trpc.collaboration.messages.useQuery({ subjectType, subjectId });
  const post = trpc.collaboration.postMessage.useMutation({
    onSuccess: () => {
      setBody("");
      void utils.collaboration.messages.invalidate({ subjectType, subjectId });
    },
  });
  const del = trpc.collaboration.deleteMessage.useMutation({
    onSuccess: () => void utils.collaboration.messages.invalidate({ subjectType, subjectId }),
  });

  const rosterData = query.data?.roster;
  const roster = useMemo(() => rosterData ?? [], [rosterData]);
  const nameById = useMemo(() => new Map(roster.map((c) => [c.id, c.name])), [roster]);
  const messages = (query.data?.messages ?? []).filter((m) => m.body || m.deletedAt);

  const send = () => {
    if (!body.trim()) return;
    post.mutate({ subjectType, subjectId, body: body.trim(), subjectLabel });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={14} aria-hidden className="text-fg-subtle" />
        <MonoLabel tone="subtle">Discussion</MonoLabel>
        {messages.length > 0 ? (
          <Text variant="caption" tone="subtle">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </Text>
        ) : null}
      </div>

      {messages.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          No discussion yet. Start one when there&rsquo;s something worth coordinating.
        </Text>
      ) : (
        <ul className={`flex flex-col gap-2 ${compact ? "max-h-72 overflow-y-auto" : ""}`}>
          {messages.map((m) => {
            const author = m.authorCollaboratorId
              ? (nameById.get(m.authorCollaboratorId) ?? "Someone")
              : "You";
            return (
              <li
                key={m.id}
                className="border-border bg-elevated flex flex-col gap-1 rounded-md border p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={author} />
                    <Text variant="body-s" className="font-medium">
                      {author}
                    </Text>
                    <Text variant="caption" tone="subtle">
                      {relative(m.createdAt)}
                      {m.editedAt ? " · edited" : ""}
                    </Text>
                  </div>
                  {!m.authorCollaboratorId && !m.deletedAt ? (
                    <button
                      type="button"
                      aria-label="Delete message"
                      className="text-fg-subtle hover:text-danger"
                      onClick={() => del.mutate({ messageId: m.id })}
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  ) : null}
                </div>
                {m.deletedAt ? (
                  <Text variant="body-s" tone="subtle">
                    <em>Message deleted</em>
                  </Text>
                ) : (
                  <Text variant="body-s" className="whitespace-pre-wrap">
                    {renderBody(m.body)}
                  </Text>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
          }}
          rows={compact ? 2 : 3}
          placeholder={
            roster.length > 0
              ? `Comment… mention with @${roster[0]!.name.split(/\s+/)[0]?.toLowerCase()}`
              : "Comment…"
          }
          className="border-border bg-base focus:border-accent w-full resize-y rounded-md border px-2.5 py-2 text-sm outline-none"
        />
        <div className="flex items-center justify-between">
          <Text variant="caption" tone="subtle">
            ⌘↵ to send{roster.length > 0 ? " · @mentions notify" : ""}
          </Text>
          <Button
            size="sm"
            variant="primary"
            disabled={post.isPending || !body.trim()}
            onClick={send}
            leftIcon={<Send size={12} aria-hidden />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials =
    name === "You"
      ? "Y"
      : name
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
  return (
    <span className="bg-accent-muted text-accent flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
      {initials}
    </span>
  );
}

/** Render a body with @mentions lightly highlighted. */
function renderBody(body: string): ReactNode {
  const parts = body.split(/(@[a-z0-9._-]+)/gi);
  return parts.map((part, i) =>
    /^@[a-z0-9._-]+$/i.test(part) ? (
      <span key={i} className="text-accent font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function relative(iso: string): string {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
