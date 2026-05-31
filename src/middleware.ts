import { NextResponse, type NextRequest } from "next/server";
import type { NextFetchEvent } from "next/server";
import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

import { isClerkEnabled } from "@/lib/env";

/** Routes that require authentication when Clerk is configured. */
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Construct the Clerk handler once. It only contacts Clerk per-request,
// so building it at module load is safe even without keys.
const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Demo mode: no auth provider configured → let every request through.
  if (!isClerkEnabled) return NextResponse.next();
  return withClerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes.
    "/(api|trpc)(.*)",
  ],
};
