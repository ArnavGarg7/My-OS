import {
  FileText,
  CheckSquare,
  StickyNote,
  Lightbulb,
  Target,
  Users,
  Link as LinkIcon,
  Image as ImageIcon,
  FileType,
  Mic,
  File,
  NotebookPen,
  Clipboard,
  type LucideIcon,
} from "lucide-react";
import type { CaptureType } from "@myos/core/inbox";

/** Capture type → icon (Sprint 2.4). Purely presentational. */
export const CAPTURE_ICON: Record<CaptureType, LucideIcon> = {
  text: FileText,
  task: CheckSquare,
  note: StickyNote,
  idea: Lightbulb,
  decision_note: Target,
  meeting: Users,
  url: LinkIcon,
  image: ImageIcon,
  pdf: FileType,
  voice: Mic,
  file: File,
  journal: NotebookPen,
  clipboard: Clipboard,
};

/** Human label for a capture type. */
export function captureLabel(type: CaptureType): string {
  return type === "decision_note" ? "Decision note" : type.charAt(0).toUpperCase() + type.slice(1);
}
