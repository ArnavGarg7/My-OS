"use client";

import { useState } from "react";
import { Button, EmptyState, Input } from "@myos/ui";
import { GraduationCap } from "lucide-react";
import type { Course } from "@myos/core/knowledge";
import { CourseCard } from "./CourseCard";

/**
 * LearningWorkspace (Sprint 4.1). The course tracker — add courses, advance modules and
 * complete them. A "course.completed" timeline event fires from the hook on completion.
 */
export function LearningWorkspace({
  courses,
  onAdd,
  onComplete,
  onAdvance,
}: {
  courses: Course[];
  onAdd: (input: { title: string; provider?: string; totalModules?: number }) => void;
  onComplete: (id: string) => void;
  onAdvance: (id: string, modules: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [modules, setModules] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a course…"
          aria-label="Course title"
        />
        <Input
          value={modules}
          onChange={(e) => setModules(e.target.value)}
          placeholder="Modules"
          aria-label="Total modules"
          className="w-24"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!title.trim()) return;
            onAdd({ title: title.trim(), totalModules: Number(modules) || 0 });
            setTitle("");
            setModules("");
          }}
        >
          Add
        </Button>
      </div>
      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description="Add a course to track your learning."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} onComplete={onComplete} onAdvance={onAdvance} />
          ))}
        </div>
      )}
    </div>
  );
}
