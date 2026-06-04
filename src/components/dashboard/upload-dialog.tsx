"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
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
import { captureFirstFrame } from "@/lib/video/capture-frame";
import { formatBytes } from "@/lib/utils";
import type { ApiResponse, Project, VideoAnalysis } from "@/lib/types";

type Phase = "idle" | "reading" | "processing";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  reading: "Reading video & capturing first frame…",
  processing: "Encoding embedding & scoring timeline…",
};

export function UploadDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const busy = phase !== "idle";

  function reset() {
    setPhase("idle");
    setFile(null);
    setTitle("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onSelect(selected: File | null) {
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      toast.error("Please choose a video file (MP4).");
      return;
    }
    setFile(selected);
    setTitle((current) => current || selected.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy) return;

    try {
      setPhase("reading");
      setProgress(20);
      const frame = await captureFirstFrame(file);
      setProgress(50);

      setPhase("processing");
      const response = await fetch("/api/videos/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || file.name,
          durationSeconds: Math.round(frame.durationSeconds),
          fileSizeBytes: file.size,
          thumbnailUrl: frame.thumbnailUrl,
          videoUrl: frame.videoUrl,
        }),
      });
      setProgress(85);

      const result: ApiResponse<{ project: Project; analysis: VideoAnalysis }> =
        await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Processing failed.");
      }

      setProgress(100);
      toast.success("Video processed — opening analysis.");
      setOpen(false);
      // Same-document navigation keeps the blob: URL valid for playback.
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
            <UploadCloud />
            Upload new video
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a video</DialogTitle>
          <DialogDescription>
            We capture the first frame as your thumbnail and turn the footage
            into a vector embedding with a stimulation timeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label
            htmlFor="video-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-accent/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <UploadCloud className="size-8 text-primary" />
            {file ? (
              <div className="text-sm">
                <p className="font-medium">{file.name}</p>
                <p className="text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div className="text-sm">
                <p className="font-medium">Click to choose an MP4</p>
                <p className="text-muted-foreground">Analysis saved to your database</p>
              </div>
            )}
            <input
              id="video-file"
              ref={inputRef}
              type="file"
              accept="video/mp4,video/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="video-title" className="text-sm font-medium">
                Project title
              </label>
              <Input
                id="video-title"
                value={title}
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a name"
              />
            </div>
          )}

          {busy && (
            <div className="flex flex-col gap-2">
              <Progress value={progress} />
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {PHASE_LABEL[phase]}
              </p>
            </div>
          )}

          <Button type="submit" disabled={!file || busy} className="w-full">
            {busy ? "Processing…" : "Analyze video"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
