"use client";

import { useState } from "react";
import { Plus, Share2, UserPlus, Users2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  MonoLabel,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@myos/ui";
import { MEMBERSHIP_ROLES, type MembershipRole } from "@myos/core/collaboration";
import { PageContainer } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import { useCollaborationStream } from "@/lib/collaboration/use-collaboration-stream";
import { DiscussionPanel } from "./DiscussionPanel";

/**
 * Collaboration hub (Stage 7). "My OS with other people." People, shared projects,
 * membership/invitations, and object discussions — all around the existing work, in the
 * Kinetic Obsidian system. Object-level collaboration also lives on the objects themselves;
 * this is the overview. Nothing is shared unless the owner shares it intentionally.
 */
export function CollaborationHub() {
  const [tab, setTab] = useState("people");
  useCollaborationStream();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Work"
        title="Collaboration"
        description="Bring people into your OS. Share projects, assign work, and discuss it where the work lives."
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="shared">Shared work</TabsTrigger>
        </TabsList>
        <TabsContent value="people">
          <PeopleSection />
        </TabsContent>
        <TabsContent value="shared">
          <SharedWorkSection />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function PeopleSection() {
  const utils = trpc.useUtils();
  const people = trpc.collaboration.collaborators.useQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const add = trpc.collaboration.addCollaborator.useMutation({
    onSuccess: () => {
      setName("");
      setEmail("");
      void utils.collaboration.collaborators.invalidate();
      void utils.collaboration.hub.invalidate();
    },
  });
  const list = people.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card variant="standard" padding="lg" className="flex flex-col gap-3">
        <MonoLabel tone="subtle">Add a person</MonoLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border-border bg-base focus:border-accent flex-1 rounded-md border px-2.5 py-2 text-sm outline-none"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="border-border bg-base focus:border-accent flex-1 rounded-md border px-2.5 py-2 text-sm outline-none"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={add.isPending || !name.trim()}
            onClick={() =>
              add.mutate({ name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) })
            }
            leftIcon={<Plus size={13} aria-hidden />}
          >
            Add
          </Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState
          icon={<Users2 size={20} aria-hidden />}
          title="Your OS is still private."
          body="Add someone above when you're ready to work together. Nothing you have is shared until you share it."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((c) => (
            <li
              key={c.id}
              className="border-border bg-elevated flex items-center gap-3 rounded-lg border p-3"
            >
              <span className="bg-accent-muted text-accent flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                {c.initials}
              </span>
              <div className="min-w-0">
                <Text variant="body-m" className="truncate font-medium">
                  {c.name}
                </Text>
                {c.email ? (
                  <Text variant="caption" tone="subtle" className="truncate">
                    {c.email}
                  </Text>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SharedWorkSection() {
  const utils = trpc.useUtils();
  const hub = trpc.collaboration.hub.useQuery();
  const projects = trpc.project.list.useQuery({});
  const [selected, setSelected] = useState<string | null>(null);
  const [toShare, setToShare] = useState("");

  const share = trpc.collaboration.shareProject.useMutation({
    onSuccess: () => {
      setToShare("");
      void utils.collaboration.hub.invalidate();
    },
  });

  const shared = hub.data?.sharedProjects ?? [];
  const sharedIds = new Set(shared.map((p) => p.id));
  const shareable = (projects.data ?? []).filter((p) => !sharedIds.has(p.id));

  return (
    <div className="flex flex-col gap-4">
      <Card variant="standard" padding="lg" className="flex flex-col gap-3">
        <MonoLabel tone="subtle">Share a project</MonoLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={toShare}
            onChange={(e) => setToShare(e.target.value)}
            className="border-border bg-base focus:border-accent flex-1 rounded-md border px-2.5 py-2 text-sm outline-none"
          >
            <option value="">Choose a project…</option>
            {shareable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            disabled={share.isPending || !toShare}
            onClick={() => share.mutate({ projectId: toShare })}
            leftIcon={<Share2 size={13} aria-hidden />}
          >
            Share
          </Button>
        </div>
      </Card>

      {shared.length === 0 ? (
        <EmptyState
          icon={<Share2 size={20} aria-hidden />}
          title="Nothing shared yet."
          body="Share a project above to start collaborating. Your other projects stay private."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {shared.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(selected === p.id ? null : p.id)}
              className={`border-border flex items-center justify-between rounded-lg border px-3 py-2.5 text-left ${
                selected === p.id ? "bg-overlay" : "bg-elevated hover:bg-overlay/60"
              }`}
            >
              <Text variant="body-m" className="font-medium">
                {p.name}
              </Text>
              <Badge variant="accent" size="sm">
                shared
              </Badge>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <SharedProjectDetail
          projectId={selected}
          projectName={shared.find((p) => p.id === selected)?.name ?? "Project"}
        />
      ) : null}
    </div>
  );
}

function SharedProjectDetail({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const utils = trpc.useUtils();
  const members = trpc.collaboration.members.useQuery({ projectId });
  const people = trpc.collaboration.collaborators.useQuery();
  const [pick, setPick] = useState("");
  const [role, setRole] = useState<MembershipRole>("commenter");

  const addMember = trpc.collaboration.addMember.useMutation({
    onSuccess: () => {
      setPick("");
      void utils.collaboration.members.invalidate({ projectId });
    },
  });

  const memberList = members.data ?? [];
  const memberIds = new Set(memberList.map((m) => m.collaboratorId));
  const addable = (people.data ?? []).filter((c) => !memberIds.has(c.id));

  return (
    <Card variant="insight" padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <MonoLabel tone="accent">People · {projectName}</MonoLabel>
        {memberList.length === 0 ? (
          <Text variant="body-s" tone="subtle">
            No members yet — add someone below.
          </Text>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {memberList.map((m) => (
              <li
                key={m.id}
                className="border-border bg-elevated flex items-center gap-2 rounded-full border py-1 pl-1 pr-3"
              >
                <span className="bg-accent-muted text-accent flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                  {m.collaborator?.initials ?? "?"}
                </span>
                <Text variant="caption">{m.collaborator?.name ?? "Unknown"}</Text>
                <Badge variant="neutral" size="sm">
                  {m.role}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="border-border bg-base focus:border-accent flex-1 rounded-md border px-2.5 py-2 text-sm outline-none"
          >
            <option value="">Add a member…</option>
            {addable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MembershipRole)}
            className="border-border bg-base focus:border-accent rounded-md border px-2.5 py-2 text-sm capitalize outline-none"
          >
            {MEMBERSHIP_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            disabled={addMember.isPending || !pick}
            onClick={() => addMember.mutate({ projectId, collaboratorId: pick, role })}
            leftIcon={<UserPlus size={13} aria-hidden />}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="border-border border-t pt-4">
        <DiscussionPanel
          subjectType="project"
          subjectId={projectId}
          subjectLabel={projectName}
          compact
        />
      </div>
    </Card>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      <span className="text-fg-subtle">{icon}</span>
      <Text variant="body-m" className="font-medium">
        {title}
      </Text>
      <Text variant="body-s" tone="subtle" className="max-w-md">
        {body}
      </Text>
    </div>
  );
}
