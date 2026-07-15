"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  Flag,
  FolderKanban,
  GitBranch,
  History,
  Link2,
  Map as MapIcon,
  Plus,
  Target,
  TrendingUp,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { Button, Input } from "@myos/ui";
import { useModal, useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useProject } from "./use-project";

function CreateProjectForm({
  onCreate,
  close,
}: {
  onCreate: (name: string) => void;
  close: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name…"
      />
      <div className="flex justify-end">
        <Button
          disabled={!name.trim()}
          onClick={() => {
            onCreate(name.trim());
            close();
          }}
        >
          Create project
        </Button>
      </div>
    </div>
  );
}

/** Project command group (Sprint 2.8). 14 commands. Registration only. */
export function ProjectCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const { open } = useModal();
  const project = useProject();

  const groups = useMemo<CommandGroup[]>(() => {
    const need = () => toaster.info("Select a project first.");
    const go = () => router.push("/projects");

    const cmd = (
      id: string,
      title: string,
      icon: LucideIcon,
      keywords: string[],
      run: () => void,
    ) => ({
      id: `project:${id}`,
      title,
      category: "project",
      icon,
      keywords: ["project", ...keywords],
      execute: (ctx: { close: () => void }) => {
        ctx.close();
        run();
      },
    });

    return [
      {
        id: "project",
        title: "Projects",
        category: "project",
        priority: 92,
        commands: [
          cmd("create", "Create Project", Plus, ["new"], () =>
            open(
              (close) => (
                <CreateProjectForm onCreate={(n) => project.create({ name: n })} close={close} />
              ),
              {
                title: "Create project",
                size: "sm",
              },
            ),
          ),
          cmd("archive", "Archive Project", Archive, ["archive"], () =>
            project.selected ? project.archive(project.selected.id) : need(),
          ),
          cmd("create-milestone", "Create Milestone", Flag, ["milestone", "new"], () => {
            if (!project.selected) return need();
            project.createMilestone({ projectId: project.selected.id, title: "New milestone" });
            toaster.success("Milestone added");
          }),
          cmd("complete-milestone", "Complete Milestone", Flag, ["milestone", "done"], () => {
            const next = project.selected?.milestones.find((m) => !m.completed);
            if (next) project.completeMilestone(next.id);
            else need();
          }),
          cmd("create-objective", "Create Objective", Target, ["objective", "kr"], () => {
            if (!project.selected) return need();
            project.createObjective({
              projectId: project.selected.id,
              title: "New objective",
              targetValue: 100,
              unit: "",
            });
            toaster.success("Objective added");
          }),
          cmd("update-progress", "Update Progress", TrendingUp, ["progress"], () => {
            if (!project.selected) return need();
            go();
            toaster.info("Progress is derived from tasks + milestones.");
          }),
          cmd("portfolio", "Show Portfolio", FolderKanban, ["portfolio"], go),
          cmd("roadmap", "Show Roadmap", MapIcon, ["roadmap"], go),
          cmd("forecast", "View Forecast", TrendingUp, ["forecast"], () =>
            project.selected ? go() : need(),
          ),
          cmd("dependencies", "View Dependencies", GitBranch, ["dependencies", "dag"], () =>
            project.selected ? go() : need(),
          ),
          cmd("attach-task", "Attach Task", Link2, ["attach", "task"], () => {
            go();
            toaster.info("Attach a task from the task view.");
          }),
          cmd("detach-task", "Detach Task", Unlink, ["detach", "task"], () => {
            go();
            toaster.info("Detach a task from the task view.");
          }),
          cmd("timeline", "Open Timeline", ArrowRight, ["timeline"], () =>
            project.selected ? go() : need(),
          ),
          cmd("history", "Show History", History, ["history", "audit"], () =>
            project.selected ? go() : need(),
          ),
        ],
      },
    ];
  }, [router, toaster, open, project]);

  useRegisterGroups(groups);
  return null;
}
