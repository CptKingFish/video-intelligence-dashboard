/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn, formatTimestamp } from "@/lib/utils";
import type { Highlight, Project } from "@/lib/types";

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  project: Project;
  highlights: Highlight[];
  duration: number;
  onTimeUpdate: (t: number) => void;
  onSeek: (t: number) => void;
}

export function VideoPlayer({
  videoRef,
  project,
  highlights,
  duration,
  onTimeUpdate,
  onSeek,
}: VideoPlayerProps) {
  const hasVideo = Boolean(project.videoUrl);

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-video bg-black">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={project.videoUrl ?? undefined}
            poster={project.thumbnailUrl}
            controls
            className="size-full"
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          />
        ) : (
          <>
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="size-full object-cover opacity-70"
            />
            <div className="absolute inset-0 grid place-items-center bg-black/40 p-6 text-center">
              <p className="flex max-w-sm items-center gap-2 rounded-lg bg-black/60 px-4 py-3 text-sm text-white backdrop-blur">
                <Info className="size-4 shrink-0" />
                In-browser preview is only available right after upload. The
                analysis below is fully preserved.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Highlight strip — click a marker to jump to that moment. */}
      <div className="p-4">
        <div className="relative h-9 w-full rounded-md bg-secondary">
          {highlights.map((h) => {
            const left = duration > 0 ? (h.start / duration) * 100 : 0;
            const width =
              duration > 0
                ? Math.max(1.5, ((h.end - h.start) / duration) * 100)
                : 2;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onSeek(h.start)}
                title={`${h.label} · ${formatTimestamp(h.start)}`}
                className={cn(
                  "absolute top-1/2 h-5 -translate-y-1/2 rounded-sm bg-primary/80 transition-all hover:h-7 hover:bg-primary",
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span className="sr-only">{h.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>0:00</span>
          <span>{highlights.length} highlights detected</span>
          <span>{formatTimestamp(duration)}</span>
        </div>
      </div>
    </Card>
  );
}
