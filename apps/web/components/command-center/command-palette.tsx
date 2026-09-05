"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, Kbd, Spinner, cn } from "@myos/ui";
import { highlightMatch, useCommandPalette, type PaletteItem } from "@/lib/command-center";
import { PaletteInterpret } from "./palette-interpret";
import { PaletteVoiceButton } from "./palette-voice-button";

/**
 * Command Palette (Sprint 1.6; V2 polish). The ⌘K interface over the Command
 * Center — a command surface, not just search: navigate, run commands, or when
 * nothing matches, capture the text straight to the Inbox. Custom keyboard
 * navigation + contains() filtering. Execution always goes through the executor.
 */
export function CommandPalette() {
  const palette = useCommandPalette();
  const listRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<(() => void) | null>(null);

  const trimmed = palette.query.trim();
  const canCapture = trimmed.length >= 2;

  // Keep the active row scrolled into view.
  useEffect(() => {
    if (!palette.activeKey || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cmd-key="${palette.activeKey}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [palette.activeKey]);

  return (
    <Dialog open={palette.open} onOpenChange={palette.setOpen}>
      <DialogContent
        hideClose
        className="top-[12vh] max-w-[600px] translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Command Center</DialogTitle>
        <DialogDescription className="sr-only">Run a command or jump to a page.</DialogDescription>

        {/* Search input */}
        <div className="border-border flex h-12 items-center gap-2.5 border-b px-4">
          <Search size={17} className="text-fg-subtle shrink-0" aria-hidden />
          <input
            autoFocus
            value={palette.query}
            onChange={(e) => palette.setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && palette.isEmpty && canCapture && captureRef.current) {
                e.preventDefault();
                captureRef.current();
                return;
              }
              palette.onKeyDown(e);
            }}
            placeholder="Search, jump, or capture…"
            aria-label="Command"
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            className="text-body-m text-fg placeholder:text-fg-subtle h-full min-w-0 flex-1 bg-transparent outline-none"
          />
          <PaletteVoiceButton onTranscript={(t) => palette.setQuery(t)} />
          <Kbd size="sm" aria-hidden>
            Esc
          </Kbd>
        </div>

        {/* Results */}
        <div
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          className="max-h-[min(420px,60vh)] overflow-y-auto overflow-x-hidden p-2"
        >
          {!palette.isReady ? (
            <div className="flex items-center justify-center gap-2 py-10">
              <Spinner size="sm" />
              <span className="text-body-s text-fg-subtle">Loading commands…</span>
            </div>
          ) : palette.isEmpty ? (
            <div className="flex flex-col gap-3 py-4">
              {canCapture ? (
                <PaletteInterpret
                  query={trimmed}
                  onClose={() => {
                    palette.setOpen(false);
                    palette.setQuery("");
                  }}
                  register={(fn) => {
                    captureRef.current = fn;
                  }}
                />
              ) : (
                <p className="text-body-s text-fg-subtle text-center">Keep typing, or press Esc.</p>
              )}
            </div>
          ) : (
            palette.sections.map((section) => (
              <div key={section.id} className="mb-1 last:mb-0">
                <div className="text-label text-fg-subtle px-2 pb-1 pt-2">{section.title}</div>
                {section.items.map((item) => (
                  <CommandRow
                    key={item.key}
                    item={item}
                    query={palette.query}
                    active={palette.activeKey === item.key}
                    onRun={() => palette.run(item.key)}
                    onHover={() => item.enabled && palette.setActiveKey(item.key)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Keyboard legend — a command surface, not just a search box. */}
        <div className="border-border text-fg-subtle flex items-center gap-3 border-t px-4 py-2 font-mono text-[10px] uppercase tracking-[0.06em]">
          <span className="flex items-center gap-1">
            <Kbd size="sm" aria-hidden>
              ↑
            </Kbd>
            <Kbd size="sm" aria-hidden>
              ↓
            </Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd size="sm" aria-hidden>
              ↵
            </Kbd>
            run
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd size="sm" aria-hidden>
              ⌘K
            </Kbd>
            omni
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandRow({
  item,
  query,
  active,
  onRun,
  onHover,
}: {
  item: PaletteItem;
  query: string;
  active: boolean;
  onRun: () => void;
  onHover: () => void;
}) {
  const { command, enabled } = item;
  const Icon = command.icon;
  const destructive = command.meta?.destructive === true;
  const segments = highlightMatch(command.title, query);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      aria-disabled={!enabled}
      data-cmd-key={item.key}
      disabled={!enabled}
      onClick={onRun}
      onMouseMove={onHover}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-md px-2 text-left outline-none",
        active ? "bg-elevated" : "bg-transparent",
        !enabled && "opacity-40",
      )}
    >
      {Icon ? (
        <Icon
          size={16}
          className={cn("shrink-0", destructive ? "text-danger" : "text-fg-subtle")}
          aria-hidden
        />
      ) : (
        <span className="w-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("text-body-m block truncate", destructive ? "text-danger" : "text-fg")}>
          {segments.map((segment, index) =>
            segment.match ? (
              <mark key={index} className="text-accent bg-transparent font-semibold">
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </span>
        {command.subtitle ? (
          <span className="text-caption text-fg-subtle block truncate">{command.subtitle}</span>
        ) : null}
      </span>
      {command.shortcut ? (
        <Kbd size="sm" className="shrink-0" aria-hidden>
          {command.shortcut}
        </Kbd>
      ) : null}
    </button>
  );
}
