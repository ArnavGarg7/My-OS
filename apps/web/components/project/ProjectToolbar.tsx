"use client";

import { LayoutGrid, Map as MapIcon, Plus } from "lucide-react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@myos/ui";
import type { ProjectSort } from "@myos/core/project";
import { ProjectSearch } from "./ProjectSearch";

export type ProjectView = "list" | "roadmap" | "portfolio";

/**
 * ProjectToolbar (Sprint 2.8). View switch (list / roadmap / portfolio), sort,
 * search and the "New project" action.
 */
export function ProjectToolbar({
  view,
  onView,
  sort,
  onSort,
  query,
  onQuery,
  onNew,
}: {
  view: ProjectView;
  onView: (view: ProjectView) => void;
  sort: ProjectSort;
  onSort: (sort: ProjectSort) => void;
  query: string;
  onQuery: (value: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b p-3">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={view === "list" ? "secondary" : "ghost"}
          onClick={() => onView("list")}
        >
          <LayoutGrid size={14} aria-hidden />
          Projects
        </Button>
        <Button
          size="sm"
          variant={view === "roadmap" ? "secondary" : "ghost"}
          onClick={() => onView("roadmap")}
        >
          <MapIcon size={14} aria-hidden />
          Roadmap
        </Button>
        <Button
          size="sm"
          variant={view === "portfolio" ? "secondary" : "ghost"}
          onClick={() => onView("portfolio")}
        >
          Portfolio
        </Button>
      </div>

      <div className="min-w-40 flex-1">
        <ProjectSearch value={query} onChange={onQuery} />
      </div>

      <Select value={sort} onValueChange={(v) => v && onSort(v as ProjectSort)}>
        <SelectTrigger aria-label="Sort projects" className="w-36">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
          <SelectItem value="target">Target date</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>

      <Button size="sm" onClick={onNew}>
        <Plus size={14} aria-hidden />
        New project
      </Button>
    </div>
  );
}
