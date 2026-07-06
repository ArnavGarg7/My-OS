"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, Kbd, Spinner, cn } from "@myos/ui";
import { highlightMatch, useCommandPalette, type PaletteItem } from "@/lib/command-center";

/**
 * Command Palette (Sprint 1.6). The ⌘K interface over the Command Center. Custom
 * keyboard navigation + simple contains() filtering (no fuzzy search). Renders
 * category headers, highlighted matches, shortcuts, and empty/loading states.
 * Execution always goes through the executor (via the controller) — never here.
 */
export function CommandPalette() {
  const palette = useCommandPalette();
  const listRef = useRef<HTMLDivElement>(null);

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
            onKeyDown={palette.onKeyDown}
            placeholder="Type a command…"
            aria-label="Command"
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            className="text-body-m text-fg placeholder:text-fg-subtle h-full min-w-0 flex-1 bg-transparent outline-none"
          />
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
            <div className="py-10 text-center">
              <p className="text-body-m text-fg">No commands found</p>
              {palette.query ? (
                <p className="text-body-s text-fg-subtle mt-1">
                  Nothing matches “{palette.query}”.
                </p>
              ) : null}
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
