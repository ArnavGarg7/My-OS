"use client";

import { useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  MonoLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from "@myos/ui";
import { PageContainer, PageContent } from "@/components/framework";
import { useEducation, todayDateIso } from "./use-education";

const KINDS = ["work", "meeting", "learning", "deliverable"] as const;
const KIND_TONE: Record<(typeof KINDS)[number], "accent" | "neutral" | "success" | "warning"> = {
  work: "accent",
  meeting: "neutral",
  learning: "success",
  deliverable: "warning",
};

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EducationInternship() {
  const edu = useEducation();
  const entries = edu.list.data?.internship ?? [];
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  const [open, setOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(todayDateIso());
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("work");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!title.trim() || !entryDate) return;
    edu.createInternshipEntry.mutate(
      {
        entryDate,
        title: title.trim(),
        kind,
        hours: hours ? Number(hours) : 0,
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          setTitle("");
          setHours("");
          setNotes("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <PageContainer width="content">
      <PageContent className="mx-auto w-full max-w-3xl space-y-6 py-2">
        <header className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <MonoLabel tone="subtle">Internship</MonoLabel>
            <Text asChild variant="heading-l" className="tracking-tight">
              <h1>Work log</h1>
            </Text>
          </div>
          <div className="text-right">
            <Text variant="heading-m" className="tabular-nums">
              {totalHours.toFixed(1)}
            </Text>
            <MonoLabel tone="subtle">hours logged</MonoLabel>
          </div>
        </header>

        <div className="flex justify-end">
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setOpen((v) => !v)}>
            Log entry
          </Button>
        </div>

        {open ? (
          <Card variant="section" padding="md" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date">
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </Field>
              <Field label="Hours">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. 6"
                />
              </Field>
            </div>
            <Field label="What">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Built the onboarding flow"
                autoFocus
              />
            </Field>
            <Field label="Type">
              <Select value={kind} onValueChange={(v) => setKind(v as (typeof KINDS)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notes" hint="optional — encrypted at rest">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Details, learnings, blockers…"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={submit}
                loading={edu.createInternshipEntry.isPending}
                disabled={!title.trim() || !entryDate}
              >
                Save entry
              </Button>
            </div>
          </Card>
        ) : null}

        {entries.length === 0 && !open ? (
          <Card variant="section" padding="lg">
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Briefcase size={22} aria-hidden className="text-fg-subtle" />
              <Text variant="body-s" tone="subtle">
                No entries yet. Log your work, meetings, learnings, and deliverables.
              </Text>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="border-border bg-surface flex items-start gap-3 rounded-md border px-3 py-2.5"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Text variant="body-s" className="font-medium">
                      {e.title}
                    </Text>
                    <Badge variant={KIND_TONE[e.kind]} size="sm" className="capitalize">
                      {e.kind}
                    </Badge>
                  </div>
                  <Text variant="caption" tone="subtle">
                    {fmtDate(e.entryDate)}
                    {e.hours ? ` · ${e.hours}h` : ""}
                  </Text>
                  {e.notes ? (
                    <Text variant="body-s" tone="muted" className="pt-0.5">
                      {e.notes}
                    </Text>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${e.title}`}
                  onClick={() => edu.deleteInternshipEntry.mutate({ id: e.id })}
                  className="text-fg-subtle hover:text-danger"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}
