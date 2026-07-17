"use client";

import { Check, GraduationCap } from "lucide-react";
import { Badge, Button, Card, Progress, Text } from "@myos/ui";
import { courseProgress, type Course } from "@myos/core/knowledge";
import { COURSE_STATUS_BADGE, COURSE_STATUS_LABEL } from "./knowledge-icons";

/**
 * CourseCard (Sprint 4.1). A course-tracker card — provider, module progress, hours and
 * a "complete" action. Progress is derived.
 */
export function CourseCard({
  course,
  onComplete,
  onAdvance,
}: {
  course: Course;
  onComplete: (id: string) => void;
  onAdvance: (id: string, modules: number) => void;
}) {
  const pct = courseProgress(course);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap size={15} aria-hidden className="text-fg-subtle" />
          <div className="flex flex-col">
            <Text variant="body-m">{course.title}</Text>
            {course.provider ? (
              <Text variant="caption" tone="subtle">
                {course.provider}
              </Text>
            ) : null}
          </div>
        </div>
        <Badge size="sm" variant={COURSE_STATUS_BADGE[course.status]}>
          {COURSE_STATUS_LABEL[course.status]}
        </Badge>
      </div>
      <Progress value={pct} aria-label="Course progress" />
      <div className="flex items-center justify-between">
        <Text variant="caption" tone="subtle">
          {course.completedModules}/{course.totalModules} modules · {course.hoursSpent}h
        </Text>
        {course.status === "in_progress" || course.status === "enrolled" ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onAdvance(course.id, Math.min(course.totalModules, course.completedModules + 1))
              }
            >
              +1 module
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onComplete(course.id)}>
              <Check size={13} aria-hidden /> Complete
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
