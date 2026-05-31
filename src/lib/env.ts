/**
 * Centralized feature flags derived from environment variables.
 *
 * The app is designed to run end-to-end on MOCK DATA with zero external
 * credentials. Each integration switches from "demo mode" to "live" only
 * when its corresponding environment variable is present.
 *
 * NOTE: `NEXT_PUBLIC_*` vars are inlined at build time and safe on the client.
 * Non-public vars (CLERK_SECRET_KEY, DATABASE_URL, ...) are server-only.
 */

/** Clerk auth is live when a publishable key is configured. */
export const isClerkEnabled: boolean =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Neon (relational) is live when a connection string is configured. */
export const isNeonEnabled: boolean = !!process.env.DATABASE_URL;

/** TimescaleDB (time-series) is live when a connection string is configured. */
export const isTimescaleEnabled: boolean = !!process.env.TIMESCALE_URL;

/** PostHog analytics is live when a project key is configured. */
export const isPostHogEnabled: boolean =
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const posthogConfig = {
  key: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
} as const;

/** External embedding/processing service. Falls back to the mock route. */
export const embeddingServiceUrl: string | undefined =
  process.env.EMBEDDING_SERVICE_URL;
