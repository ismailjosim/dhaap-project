import { redirect } from "next/navigation";
import { AppHeader } from "@/components/common/app-header";
import { BottomNav } from "@/components/common/bottom-nav";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-6">
      <AppHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
