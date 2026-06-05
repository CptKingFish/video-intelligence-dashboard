import { Film } from "lucide-react";

import { BRAND } from "@/lib/brand";
import { IntelliralLogo } from "@/components/brand/intelliral-logo";
import { AbTestDialog } from "@/components/dashboard/ab-test-dialog";
import { UploadDialog } from "@/components/dashboard/upload-dialog";

/**
 * The empty main page shown when the signed-in user has no projects yet.
 */
export function EmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/25 blur-3xl" />
        <div className="grid size-24 place-items-center rounded-3xl border bg-gradient-to-br from-card to-primary/5 shadow-lg">
          <Film className="size-10 text-primary" />
        </div>
      </div>
      <IntelliralLogo size="lg" className="mb-4 justify-center" />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Simulate before you post
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {BRAND.shortDescription}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <UploadDialog />
        <AbTestDialog />
      </div>
    </div>
  );
}
