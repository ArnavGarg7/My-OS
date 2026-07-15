import type { ClosingSection as ClosingData } from "@myos/core/morning";

/** 14. Closing — a small sentence. */
export function ClosingSection({ data }: { data: ClosingData }) {
  return <p className="text-body-m text-fg-subtle py-8 text-center">{data.message}</p>;
}
