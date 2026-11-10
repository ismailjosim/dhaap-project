import { redirect } from "next/navigation";
import { TodayView } from "@/components/today/today-view";
import { connectDB } from "@/lib/db";
import { DayPlan, Roadmap } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";
import { getOrCreateUserSettings } from "@/lib/settings";

export const metadata = {
  title: "Today's Plan — Dhaap",
  description: "Your daily focused learning and spaced recall plan.",
};

function getTodayDateString(timezone = "Asia/Dhaka"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export default async function TodayPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const settings = await getOrCreateUserSettings(user.id);
  const todayStr = getTodayDateString(settings.timezone);

  const [activeRoadmap, dayPlanDoc] = await Promise.all([
    Roadmap.findOne({ userId: user.id, isActive: true }).lean(),
    DayPlan.findOne({ userId: user.id, date: todayStr }).lean(),
  ]);

  // Convert MongoDB documents to plain JSON for client component
  const serializedSettings = JSON.parse(JSON.stringify(settings));
  const serializedPlan = dayPlanDoc
    ? JSON.parse(JSON.stringify(dayPlanDoc))
    : null;

  return (
    <TodayView
      initialPlan={serializedPlan}
      settings={serializedSettings}
      todayDateStr={todayStr}
      hasRoadmap={Boolean(activeRoadmap)}
    />
  );
}
