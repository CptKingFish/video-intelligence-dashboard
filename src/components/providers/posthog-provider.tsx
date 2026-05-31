"use client";

import * as React from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

import { isPostHogEnabled, posthogConfig } from "@/lib/env";

/**
 * Initializes PostHog on the client when a key is configured.
 * In demo mode (no key) it renders children untouched — no network calls.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (!isPostHogEnabled || posthog.__loaded) return;
    posthog.init(posthogConfig.key, {
      api_host: posthogConfig.host,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }, []);

  if (!isPostHogEnabled) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
