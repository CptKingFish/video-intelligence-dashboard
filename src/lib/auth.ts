import { isClerkEnabled } from "@/lib/env";
import { DEMO_OWNER } from "@/lib/mock/store";

/** Minimal user shape the app needs, independent of the auth provider. */
export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  imageUrl: string | null;
  isDemo: boolean;
}

const DEMO_USER: CurrentUser = {
  id: DEMO_OWNER,
  name: "Demo User",
  email: "demo@videointel.app",
  imageUrl: null,
  isDemo: true,
};

/**
 * Resolve the current user.
 *
 * - When Clerk is configured, reads the real authenticated session.
 * - Otherwise returns a stable demo user so the app is fully usable
 *   without any credentials.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (!isClerkEnabled) return DEMO_USER;

  // Imported lazily so the Clerk SDK is never invoked in demo mode.
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) return DEMO_USER;

  return {
    id: user.id,
    name:
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "User",
    email: user.emailAddresses[0]?.emailAddress ?? null,
    imageUrl: user.imageUrl ?? null,
    isDemo: false,
  };
}
