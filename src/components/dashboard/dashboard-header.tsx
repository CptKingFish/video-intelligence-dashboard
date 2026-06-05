"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

import { IntelliralLogo } from "@/components/brand/intelliral-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/lib/auth";

// Clerk's UserButton is only loaded when auth is enabled (provider present).
const UserButton = dynamic(
  () => import("@clerk/nextjs").then((m) => m.UserButton),
  { ssr: false },
);

export function DashboardHeader({
  user,
  clerkEnabled,
}: {
  user: CurrentUser;
  clerkEnabled: boolean;
}) {
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/dashboard"
          prefetch={false}
          className="flex items-center gap-2"
        >
          <IntelliralLogo size="sm" />
          {user.isDemo && <Badge variant="outline">Demo</Badge>}
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {clerkEnabled ? (
            <UserButton />
          ) : (
            <Avatar>
              {user.imageUrl && <AvatarImage src={user.imageUrl} alt={user.name} />}
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
