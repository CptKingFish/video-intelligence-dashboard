"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Auth-aware CTA cluster for the landing nav/hero.
 * Rendered client-side; `clerkEnabled` is passed from the server so we don't
 * touch Clerk components (which require a provider) in demo mode.
 */
export function AuthButtons({
  clerkEnabled,
  size = "default",
}: {
  clerkEnabled: boolean;
  size?: "default" | "lg";
}) {
  return (
    <div className="flex items-center gap-3">
      {clerkEnabled && (
        <Button variant="ghost" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      )}
      <Button size={size} asChild>
        <Link href="/dashboard">
          {clerkEnabled ? "Get started" : "Open dashboard"}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
