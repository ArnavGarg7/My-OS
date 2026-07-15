"use client";

import { useState } from "react";
import { CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { Button, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { useNotification } from "./use-notification";
import { NotificationList } from "./NotificationList";
import { NotificationFilters } from "./NotificationFilters";
import { NotificationHistory } from "./NotificationHistory";
import { NotificationPreferences } from "./NotificationPreferences";
import { NotificationSettings } from "./NotificationSettings";

/**
 * NotificationCenter (Sprint 3.3). The /notifications page — the editorial home for
 * every notification. Tabs for the inbox, history and preferences. Deterministic; the
 * engine decides what exists, this reflects + acts on it.
 */
export function NotificationCenter() {
  const n = useNotification();
  const [tab, setTab] = useState("inbox");

  if (n.isLoading && n.notifications.length === 0 && !n.count) {
    return <PageLoading label="Loading notifications…" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="Everything your OS wants you to know — in one place."
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={n.generate} disabled={n.generating}>
          <RefreshCw size={13} aria-hidden /> Check now
        </Button>
        <Button size="sm" variant="ghost" onClick={n.markAllRead}>
          <CheckCheck size={13} aria-hidden /> Mark all read
        </Button>
        <Button size="sm" variant="ghost" onClick={n.dismissAll}>
          <Trash2 size={13} aria-hidden /> Dismiss all
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="flex flex-col gap-3">
            <NotificationFilters filter={n.filter} onChange={n.setFilter} />
            <NotificationList
              notifications={n.notifications}
              onComplete={n.complete}
              onDismiss={n.dismiss}
              onSnooze={(id) => n.snooze(id, "30m")}
            />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistory entries={n.history} />
        </TabsContent>

        <TabsContent value="preferences">
          {n.preferences ? (
            <div className="flex flex-col gap-6">
              <NotificationPreferences preferences={n.preferences} onUpdate={n.updatePreference} />
              <NotificationSettings preferences={n.preferences} onUpdate={n.updatePreference} />
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
