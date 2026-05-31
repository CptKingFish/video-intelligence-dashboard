import { Film } from "lucide-react";

import { UploadDialog } from "@/components/dashboard/upload-dialog";

/**
 * The empty main page: a prominent "Upload new video!" call to action shown
 * when the signed-in user has no projects yet.
 */
export function EmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
        <div className="grid size-20 place-items-center rounded-2xl border bg-card">
          <Film className="size-9 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Upload new video!
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        You don&apos;t have any projects yet. Drop in an MP4 and we&apos;ll
        capture the thumbnail, generate its embedding, and chart the moments
        that matter.
      </p>
      <div className="mt-8">
        <UploadDialog />
      </div>
    </div>
  );
}
