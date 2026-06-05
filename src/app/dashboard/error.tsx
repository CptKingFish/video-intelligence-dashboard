"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  const isDb =
    /fetch failed|DATABASE_URL|Failed query|NeonDbError/i.test(error.message);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">
        {isDb ? "Database connection failed" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {isDb
          ? "Neon could not be reached (cold start or network blip). Migrations are applied — try again in a few seconds."
          : error.message}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>
          <RefreshCw />
          Retry
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
