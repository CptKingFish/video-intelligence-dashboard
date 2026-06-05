import Link from "next/link";
import { Brain, Clock, Music2, Play, Sparkles } from "lucide-react";

import { VideoThumbnail } from "@/components/dashboard/video-thumbnail";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTimestamp, cn } from "@/lib/utils";
import type { Project, ProcessingStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  ProcessingStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  queued: "secondary",
  processing: "warning",
  ready: "success",
  failed: "destructive",
};

function brainScoreTone(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

export function ProjectCard({ project }: { project: Project }) {
  const score = project.brainResponseScore;

  return (
    <Link
      href={`/dashboard/videos/${project.id}`}
      prefetch={false}
      className="group block"
    >
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card shadow-sm",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
        )}
      >
        {/* TikTok-style 9:16 portrait frame */}
        <div className="relative aspect-[9/16] overflow-hidden bg-zinc-950">
          <VideoThumbnail
            thumbnailUrl={project.thumbnailUrl}
            videoUrl={project.videoUrl}
            alt={project.title}
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {/* Top gradient scrim */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
          {/* Bottom gradient scrim */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* TikTok badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <Music2 className="size-3 text-[#fe2c55]" />
            TikTok
          </div>

          {/* Status */}
          <div className="absolute right-3 top-3">
            <Badge
              variant={STATUS_VARIANT[project.status]}
              className="border-0 bg-black/50 capitalize text-white backdrop-blur-md"
            >
              {project.status}
            </Badge>
          </div>

          {/* Duration pill */}
          <div className="absolute right-3 top-12 flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            <Clock className="size-3" />
            {formatTimestamp(project.durationSeconds)}
          </div>

          {/* Brain score ring */}
          {score != null && (
            <div className="absolute left-3 top-12 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-md">
              <Brain className={cn("size-3.5", brainScoreTone(score))} />
              <span className="text-[11px] font-bold text-white">{score}</span>
              <span className="text-[10px] text-white/70">BR</span>
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="grid size-14 place-items-center rounded-full bg-white/95 text-zinc-900 shadow-2xl ring-4 ring-white/20">
              <Play className="size-6 fill-current pl-0.5" />
            </span>
          </div>

          {/* Title + meta overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
              {project.title}
            </h3>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/70">
              <span>{formatDate(project.createdAt)}</span>
              {score != null && (
                <span className="flex items-center gap-1 text-white/80">
                  <Sparkles className="size-3 text-primary" />
                  Analyzed
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
