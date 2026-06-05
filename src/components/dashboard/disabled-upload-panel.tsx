import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DisabledUploadPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center rounded-2xl border border-dashed bg-muted/30 px-6 py-10",
        className,
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <Button size="lg" disabled className="pointer-events-none gap-2">
          <Upload className="size-4" />
          Upload video
        </Button>
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        We are disabling video submission for now due to lack of money.
      </p>
    </div>
  );
}
