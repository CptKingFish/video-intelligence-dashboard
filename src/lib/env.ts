/**
 * Feature flags derived from environment variables.
 *
 * NOTE: `NEXT_PUBLIC_*` vars are inlined at build time and safe on the client.
 * Non-public vars (CLERK_SECRET_KEY, DATABASE_URL, ...) are server-only.
 */

/** Clerk auth is live when a publishable key is configured. */
export const isClerkEnabled: boolean =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Neon (relational) requires a connection string. */
export const isNeonEnabled: boolean = !!process.env.DATABASE_URL;

/** TimescaleDB (time-series) is optional; timeline falls back to Neon. */
export const isTimescaleEnabled: boolean = !!process.env.TIMESCALE_URL;

/** PostHog analytics is live when a project key is configured. */
export const isPostHogEnabled: boolean =
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const posthogConfig = {
  key: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
} as const;

/** External embedding/processing service (optional). */
export const embeddingServiceUrl: string | undefined =
  process.env.EMBEDDING_SERVICE_URL;
