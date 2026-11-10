import { headers } from "next/headers";
import { auth } from "./auth";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session || !session.user) {
      return null;
    }

    return session.user as SessionUser;
  } catch (error) {
    console.error("[getSessionUser] Error fetching session:", error);
    return null;
  }
}
