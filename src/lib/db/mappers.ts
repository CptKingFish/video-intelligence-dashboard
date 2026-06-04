import type { ProjectRow, TimelineRow } from "@/lib/db/schema";
import type {
  Highlight,
  Project,
  TimelinePoint,
  VideoAnalysis,
} from "@/lib/types";

export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl,
    videoUrl: row.videoUrl,
    status: row.status,
    durationSeconds: row.durationSeconds,
    fileSizeBytes: row.fileSizeBytes,
    embeddingDim: row.embeddingDim,
    createdAt: row.createdAt.toISOString(),
  };
}

export function rowToTimelinePoint(row: TimelineRow): TimelinePoint {
  return {
    t: row.t,
    score: row.score,
    energy: row.energy,
    motion: row.motion,
  };
}

export function parseStoredAnalysis(
  project: Project,
  row: ProjectRow,
  timeline: TimelinePoint[],
): VideoAnalysis | null {
  if (!row.embedding || !row.stats || !row.highlights) return null;

  const embedding = JSON.parse(row.embedding) as number[];
  const highlights = JSON.parse(row.highlights) as Highlight[];
  const stats = JSON.parse(row.stats) as VideoAnalysis["stats"];

  return {
    projectId: project.id,
    embedding,
    embeddingDim: row.embeddingDim,
    durationSeconds: row.durationSeconds,
    timeline,
    highlights,
    stats,
  };
}
