"use client";

import * as React from "react";
import { Check, Clock, Loader2, Music2 } from "lucide-react";

import { VideoThumbnail } from "@/components/dashboard/video-thumbnail";
import { cn, formatTimestamp } from "@/lib/utils";
import type { VideoSample } from "@/lib/types";

export function SamplePickerCard({
  sample,
  active,
  disabled,
  onSelect,
}: {
  sample: VideoSample;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-xl border text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40 hover:shadow-md",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-zinc-950">
        <VideoThumbnail
          thumbnailUrl={sample.thumbnailUrl ?? ""}
          videoUrl={sample.videoUrl}
          alt={sample.title}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-10">
          <p className="line-clamp-2 text-xs font-semibold text-white">
            {sample.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-white/70">
            {sample.description}
          </p>
        </div>
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <Music2 className="size-2.5 text-[#fe2c55]" />
          TikTok
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
          <Clock className="size-2.5" />
          {formatTimestamp(sample.durationSeconds)}
        </div>
        {active && (
          <div className="absolute inset-0 grid place-items-center bg-primary/20">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Check className="size-4" />
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export function SamplePickerSkeleton() {
  return (
    <div className="flex aspect-[9/16] items-center justify-center rounded-xl border bg-muted">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
