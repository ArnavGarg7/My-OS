import { getPreferences } from "@/server/identity";
import { PreferencesForm } from "@/components/identity/preferences-form";

export const metadata = { title: "Preferences" };

export default async function SettingsPage() {
  const preferences = await getPreferences();
  return <PreferencesForm preferences={preferences} />;
}
