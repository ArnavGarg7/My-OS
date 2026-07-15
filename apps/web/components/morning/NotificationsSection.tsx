import type { NotificationsSection as NotificationsData } from "@myos/core/morning";

function Item({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-caption text-fg-subtle">{label}</div>
      <div className="text-body-m text-fg font-mono tabular-nums">{value}</div>
    </div>
  );
}

/** 12. Notifications — read-only counts. Nothing interactive. */
export function NotificationsSection({ data }: { data: NotificationsData }) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3">
      <Item label="Unread inbox" value={data.unreadInbox} />
      <Item label="Pending decisions" value={data.pendingDecisions} />
      <Item label="Pending notes" value={data.pendingNotes} />
    </div>
  );
}
