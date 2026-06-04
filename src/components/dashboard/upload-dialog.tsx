"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ApiResponse, Project, VideoAnalysis, VideoSample } from "@/lib/types";

type Phase = "idle" | "processing";

export function UploadDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [samples, setSamples] = React.useState<VideoSample[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [progress, setProgress] = React.useState(0);

  const busy = phase !== "idle";
  const selected = samples.find((s) => s.id === selectedId) ?? null;

  React.useEffect(() => {
    if (!open) return;
    void fetch("/api/videos/samples")
      .then((r) => r.json())
      .then((body: ApiResponse<{ samples: VideoSample[] }>) => {
        if (body.success && body.data) setSamples(body.data.samples);
      })
      .catch(() => toast.error("Could not load demo videos."));
  }, [open]);

  function reset() {
    setPhase("idle");
    setSelectedId(null);
    setTitle("");
    setProgress(0);
  }

  function onPick(sample: VideoSample) {
    setSelectedId(sample.id);
    setTitle(sample.title);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || busy) return;

    try {
      setPhase("processing");
      setProgress(30);

      const response = await fetch("/api/videos/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleId: selectedId,
          title: title.trim() || selected?.title,
          durationSeconds: selected?.durationSeconds ?? 15,
          fileSizeBytes: 0,
        }),
      });
      setProgress(85);

      const result: ApiResponse<{ project: Project; analysis: VideoAnalysis }> =
        await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Processing failed.");
      }

      setProgress(100);
      toast.success("Simulation ready — opening analysis.");
      setOpen(false);
      router.push(`/dashboard/videos/${result.data.project.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
      setPhase("idle");
      setProgress(0);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Sparkles />
            Simulate a TikTok
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a demo TikTok</DialogTitle>
          <DialogDescription>
            Pick one of five curated clips (~10–20s) hosted on UploadThing. Custom
            uploads are disabled for the hackathon demo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {samples.map((sample) => {
              const active = sample.id === selectedId;
              return (
                <button
                  key={sample.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onPick(sample)}
                  className={cn(
                    "relative rounded-lg border p-3 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/40",
                  )}
                >
                  {active && (
                    <Check className="absolute right-2 top-2 size-4 text-primary" />
                  )}
                  <p className="pr-6 font-medium">{sample.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {sample.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="video-title" className="text-sm font-medium">
                Project title
              </label>
              <Input
                id="video-title"
                value={title}
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name this simulation"
              />
            </div>
          )}

          {busy && (
            <div className="flex flex-col gap-2">
              <Progress value={progress} />
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Encoding TRIBE embedding & running viral simulator…
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedId || busy}
            className="w-full"
          >
            {busy ? "Processing…" : "Run brain analysis"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
