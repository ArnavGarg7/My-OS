import { requireUser } from "@/server/identity";
import { ProfileView } from "@/components/identity/profile-view";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const identity = await requireUser();
  return <ProfileView identity={identity} />;
}
