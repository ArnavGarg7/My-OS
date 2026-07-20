"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Text, Textarea } from "@myos/ui";
import { PageContainer, PageContent, PageHeader } from "@/components/framework";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

type ChatResult = RouterOutputs["assistant"]["chat"];
type Turn = ChatResult["turn"];

/** A message as rendered in the transcript — either the user's text or a completed assistant turn. */
interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  turn?: Turn;
}

/**
 * The Chief Chat — the conversational interface to My OS (Sprint 5.3). The user talks to the Chief
 * instead of navigating modules. Every assistant answer is GROUNDED: built from deterministic tool
 * results (citations shown), mutations are PROPOSALS (never applied here), and when the OS doesn't
 * know something the Chief says so. Runs on the Local provider offline; a cloud provider swaps in via
 * the Provider Policy without changing this UI.
 */
export function ChiefChat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const chat = trpc.assistant.chat.useMutation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    const localId = `u_${Date.now().toString(36)}`;
    setMessages((m) => [...m, { id: localId, role: "user", content: trimmed }]);
    setDraft("");
    chat.mutate(
      { message: trimmed, ...(conversationId ? { conversationId } : {}) },
      {
        onSuccess: (res) => {
          setConversationId(res.conversationId);
          setMessages((m) => [
            ...m,
            {
              id: res.sessionId || `a_${Date.now().toString(36)}`,
              role: "assistant",
              content: res.turn.message.content,
              turn: res.turn,
            },
          ]);
        },
      },
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Chief"
        description="Talk to your operating system. Every answer is grounded in your real data — the Chief never makes things up."
      />
      <PageContent>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? <EmptyState onPick={send} /> : null}

          <div className="flex flex-col gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <UserBubble key={m.id} text={m.content} />
              ) : (
                <AssistantBubble key={m.id} message={m} />
              ),
            )}
            {chat.isPending ? <ThinkingIndicator /> : null}
            {chat.isError ? (
              <Text variant="body-s" className="text-danger">
                Something went wrong reaching the Chief. Try again.
              </Text>
            ) : null}
            <div ref={endRef} />
          </div>

          <Composer
            draft={draft}
            setDraft={setDraft}
            onSend={() => send(draft)}
            pending={chat.isPending}
          />
        </div>
      </PageContent>
    </PageContainer>
  );
}

const SUGGESTIONS = [
  "What should I do now?",
  "What's on my calendar today?",
  "Why is this my priority?",
  "Move my workout to Friday",
];

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <Text variant="heading-m">How can I help?</Text>
      <Text variant="body-s" className="text-fg-muted">
        Ask about your day, your tasks, your calendar — or ask me to reshuffle your plan. I answer
        from your operating system's real data and propose changes before applying anything.
      </Text>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Button key={s} variant="secondary" size="sm" onClick={() => onPick(s)}>
            {s}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function Composer({
  draft,
  setDraft,
  onSend,
  pending,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  pending: boolean;
}) {
  return (
    <div className="bg-base border-border sticky bottom-0 flex items-end gap-2 border-t pt-3">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Ask the Chief anything…  (Enter to send, Shift+Enter for a new line)"
        className="min-h-11 flex-1 resize-none"
        rows={1}
      />
      <Button variant="primary" onClick={onSend} disabled={pending || !draft.trim()}>
        Send
      </Button>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="bg-accent-subtle border-border max-w-[80%] rounded-lg border px-4 py-2">
        <Text variant="body-m" className="whitespace-pre-wrap">
          {text}
        </Text>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: UiMessage }) {
  const turn = message.turn;
  return (
    <div className="flex flex-col gap-2">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Text variant="body-s" className="text-fg-muted">
              Chief
            </Text>
            {turn ? <ProviderBadge provider={turn.provider} /> : null}
          </div>
          {turn ? <GroundingBadge grounded={turn.grounded} unknown={turn.unknown} /> : null}
        </div>

        <Text variant="body-m" className="whitespace-pre-wrap">
          {message.content}
        </Text>

        {turn?.message.citations && turn.message.citations.length > 0 ? (
          <CitationPanel citations={turn.message.citations} />
        ) : null}

        {turn?.message.toolCalls && turn.message.toolCalls.length > 0 ? (
          <ToolTrail calls={turn.message.toolCalls} />
        ) : null}
      </Card>

      {turn?.proposal ? <ProposalPreview proposal={turn.proposal} /> : null}
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return <Badge variant={provider === "local" ? "neutral" : "accent"}>via {provider}</Badge>;
}

function GroundingBadge({ grounded, unknown }: { grounded: boolean; unknown: boolean }) {
  if (unknown) return <Badge variant="warning">not in your OS</Badge>;
  return (
    <Badge variant={grounded ? "success" : "neutral"}>{grounded ? "grounded" : "general"}</Badge>
  );
}

function CitationPanel({ citations }: { citations: NonNullable<Turn["message"]["citations"]> }) {
  return (
    <div className="border-border flex flex-col gap-1.5 border-t pt-2">
      <Text variant="body-s" className="text-fg-muted">
        Sources
      </Text>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c, i) => (
          <Badge key={`${c.module}:${c.id}:${i}`} variant="neutral">
            {c.module} · {c.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ToolTrail({ calls }: { calls: NonNullable<Turn["message"]["toolCalls"]> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-border border-t pt-2">
      <button
        type="button"
        className="text-fg-muted hover:text-fg text-xs underline underline-offset-2"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide" : "Show"} how I found this ({calls.length} tool
        {calls.length === 1 ? "" : "s"})
      </button>
      {open ? (
        <div className="mt-2 flex flex-col gap-1">
          {calls.map((t, i) => (
            <div key={`${t.tool}:${i}`} className="flex items-center justify-between">
              <Text variant="body-s" className="font-mono">
                {t.tool}
              </Text>
              <div className="flex items-center gap-2">
                <Text variant="body-s" className="text-fg-muted">
                  {t.resultSummary}
                </Text>
                <Badge variant={t.ok ? "success" : "danger"}>{t.ok ? "ok" : "failed"}</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProposalPreview({ proposal }: { proposal: NonNullable<Turn["proposal"]> }) {
  const [decided, setDecided] = useState<"accepted" | "dismissed" | null>(null);
  return (
    <Card className="border-accent ml-4 flex flex-col gap-3 border p-4">
      <div className="flex items-center justify-between">
        <Text variant="heading-s">Proposed change</Text>
        <Badge variant="accent">{proposal.kind}</Badge>
      </div>
      <Text variant="body-m">{proposal.summary}</Text>
      {proposal.preview.length > 0 ? (
        <div className="flex flex-col gap-1">
          {proposal.preview.map((line, i) => (
            <Text key={i} variant="body-s" className="text-fg-muted">
              • {line}
            </Text>
          ))}
        </div>
      ) : null}
      {decided ? (
        <Badge variant={decided === "accepted" ? "success" : "neutral"}>
          {decided === "accepted" ? "Accepted — the plan is yours to apply" : "Dismissed"}
        </Badge>
      ) : (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setDecided("accepted")}>
            Accept
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDecided("dismissed")}>
            Dismiss
          </Button>
        </div>
      )}
      <Text variant="body-s" className="text-fg-muted">
        Nothing changes until you accept. The Chief never edits your plan directly.
      </Text>
    </Card>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <span className="bg-fg-muted h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
        <span className="bg-fg-muted h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
        <span className="bg-fg-muted h-2 w-2 animate-bounce rounded-full" />
      </div>
      <Text variant="body-s" className="text-fg-muted">
        The Chief is checking your operating system…
      </Text>
    </div>
  );
}
