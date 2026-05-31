/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock, Fingerprint, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatTimestamp } from "@/lib/utils";
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

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/dashboard/videos/${project.id}`} className="group">
      <Card className="overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {/* Thumbnail is the video's captured first frame (or gradient seed). */}
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute right-2 top-2">
            <Badge variant={STATUS_VARIANT[project.status]} className="capitalize">
              {project.status}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
            <Clock className="size-3" />
            {formatTimestamp(project.durationSeconds)}
          </div>
          <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="grid size-12 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
              <Play className="size-5 fill-current" />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <h3 className="truncate font-semibold leading-tight">{project.title}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(project.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Fingerprint className="size-3" />
              {project.embeddingDim}-d
            </span>
          </div>
          <code className="truncate text-[10px] text-muted-foreground/70">
            {project.id}
          </code>
        </div>
      </Card>
    </Link>
  );
}
