import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/today");
  } else {
    redirect("/login");
  }
}
