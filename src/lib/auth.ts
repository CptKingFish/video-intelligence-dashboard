import { isClerkEnabled } from "@/lib/env";

/** Stable owner id when Clerk is not configured (local dev without auth). */
export const DEMO_OWNER_ID = "demo-user";

/** Minimal user shape the app needs, independent of the auth provider. */
export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  imageUrl: string | null;
  isDemo: boolean;
}

const DEMO_USER: CurrentUser = {
  id: DEMO_OWNER_ID,
  name: "Demo User",
  email: "demo@intelliral.app",
  imageUrl: null,
  isDemo: true,
};

/**
 * Resolve the current user.
 *
 * - When Clerk is configured, reads the authenticated session.
 * - Without Clerk, returns a stable demo user for local development.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (!isClerkEnabled) return DEMO_USER;

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
