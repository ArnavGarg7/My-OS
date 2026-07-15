import { Check, Clock, HelpCircle, X } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@myos/ui";
import type { DeferOption } from "@myos/core/decision";

/**
 * Decision actions (Sprint 2.3): Accept · Dismiss · Later · Why?. "Later" opens
 * the defer options.
 */
export function DecisionActions({
  onAccept,
  onDismiss,
  onDefer,
  onWhy,
  pending,
}: {
  onAccept: () => void;
  onDismiss: () => void;
  onDefer: (option: DeferOption) => void;
  onWhy: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onAccept} loading={pending} leftIcon={<Check size={15} aria-hidden />}>
        Accept
      </Button>
      <Button
        variant="secondary"
        onClick={onDismiss}
        disabled={pending}
        leftIcon={<X size={15} aria-hidden />}
      >
        Dismiss
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" disabled={pending} leftIcon={<Clock size={15} aria-hidden />}>
            Later
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onDefer("15m")}>In 15 minutes</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDefer("30m")}>In 30 minutes</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDefer("1h")}>In 1 hour</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDefer("tomorrow")}>Tomorrow</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        onClick={onWhy}
        className="ml-auto"
        leftIcon={<HelpCircle size={15} aria-hidden />}
      >
        Why?
      </Button>
    </div>
  );
}
