import { Lightbulb } from "lucide-react";
import { Badge } from "@myos/ui";
import type { RecommendationSection as RecommendationData } from "@myos/core/morning";

/** 13. Recommendation — the most important section. Deterministic (no AI). */
export function RecommendationSection({ data }: { data: RecommendationData }) {
  return (
    <div className="border-accent-border bg-accent-muted/25 rounded-xl border p-5">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb size={16} className="text-accent" aria-hidden />
        <span className="text-label text-accent uppercase tracking-wide">Recommendation</span>
        <Badge variant="neutral" className="ml-auto">
          {data.confidence}% confidence
        </Badge>
      </div>
      <p className="text-heading-s text-fg">{data.decision}</p>
      <p className="text-body-m text-fg-muted mt-1">{data.reason}</p>
    </div>
  );
}
