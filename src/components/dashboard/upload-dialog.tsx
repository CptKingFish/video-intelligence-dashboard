"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { ActionCtaButton } from "@/components/dashboard/action-cta-button";
import { SamplePickerCard } from "@/components/dashboard/sample-picker-card";
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
import { captureFirstFrameFromUrl } from "@/lib/video/capture-frame";
import type { ApiResponse, Project, VideoAnalysis, VideoSample } from "@/lib/types";

type Phase = "idle" | "capturing" | "processing";

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
    if (!selected || busy) return;

    try {
      setPhase("capturing");
      setProgress(15);

      const captured = await captureFirstFrameFromUrl(selected.videoUrl);
      setProgress(35);

      setPhase("processing");

      const response = await fetch("/api/videos/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleId: selected.id,
          title: title.trim() || selected.title,
          thumbnailUrl: captured.thumbnailUrl,
        }),
      });
      setProgress(85);

      const result: ApiResponse<{ project: Project; analysis: VideoAnalysis }> =
        await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Processing failed.");
      }

      setProgress(100);
      toast.success("Intelliral simulation ready — opening analysis.");
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
          <ActionCtaButton
            variant="simulate"
            icon={<Zap className="size-4" />}
            label="Simulate a TikTok"
            hint="Run neural brain analysis"
          />
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl gap-5">
        <DialogHeader>
          <DialogTitle>Simulate a TikTok with Intelliral</DialogTitle>
          <DialogDescription>
            Pick a curated vertical clip. Intelliral captures a real frame and
            runs TRIBE brain analysis before you post.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {samples.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex aspect-[9/16] items-center justify-center rounded-xl border bg-muted"
                  >
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ))
              : samples.map((sample) => (
                  <SamplePickerCard
                    key={sample.id}
                    sample={sample}
                    active={sample.id === selectedId}
                    disabled={busy}
                    onSelect={() => onPick(sample)}
                  />
                ))}
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
                {phase === "capturing"
                  ? "Capturing TikTok thumbnail…"
                  : "Encoding TRIBE embedding & running viral simulator…"}
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
