import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { getSessionUser } from "@/lib/server-auth";
import { getOrCreateUserSettings } from "@/lib/settings";

export const metadata = {
  title: "Settings — Dhaap",
  description: "Configure study caps, rest days, and grading thresholds.",
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const settings = await getOrCreateUserSettings(user.id);

  return (
    <SettingsView initialSettings={JSON.parse(JSON.stringify(settings))} />
  );
}
