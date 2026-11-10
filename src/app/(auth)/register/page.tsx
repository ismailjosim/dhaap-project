import Image from "next/image";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Account — Dhaap",
  description: "Create an account on Dhaap learning engine.",
};

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/today");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl overflow-hidden mb-3 shadow-xs">
            <Image
              src="/logo.svg"
              alt="Dhaap Logo"
              width={56}
              height={56}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Start Your Mastery on Dhaap
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Roadmap → Daily Plan → Spaced Recall → Senior Engineer Mastery
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
