import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import {
  getNeonDb,
  getTimescaleDb,
  isTimescaleReachable,
} from "@/lib/db/clients";
import {
  parseStoredAnalysis,
  rowToProject,
  rowToTimelinePoint,
} from "@/lib/db/mappers";
import { projects, timelinePoints } from "@/lib/db/schema";
import type { Project, VideoAnalysis } from "@/lib/types";

const TIMELINE_BATCH_SIZE = 500;

async function requireNeonDb() {
  const db = await getNeonDb();
  if (!db) {
    throw new Error(
      "DATABASE_URL is required. Configure your Neon connection string in .env.local.",
    );
  }
  return db;
}

/** Timeline rows live in Timescale when configured and reachable, otherwise Neon. */
async function getTimelineDb() {
  if (await isTimescaleReachable()) {
    const timescale = await getTimescaleDb();
    if (timescale) return timescale;
  }
  return requireNeonDb();
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  const db = await requireNeonDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, ownerId))
    .orderBy(desc(projects.createdAt));

  return rows.map(rowToProject);
}

export async function findProjectById(id: string): Promise<Project | null> {
  const db = await requireNeonDb();
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  return row ? rowToProject(row) : null;
}

export async function insertProjectWithAnalysis(
  project: Project,
  analysis: VideoAnalysis,
): Promise<Project> {
  const db = await requireNeonDb();
  const timelineDb = await getTimelineDb();

  await db.insert(projects).values({
    id: project.id,
    ownerId: project.ownerId,
    title: project.title,
    thumbnailUrl: project.thumbnailUrl,
    videoUrl: project.videoUrl,
    status: project.status,
    durationSeconds: project.durationSeconds,
    fileSizeBytes: project.fileSizeBytes,
    embeddingDim: project.embeddingDim,
    embedding: JSON.stringify(analysis.embedding),
    highlights: JSON.stringify(analysis.highlights),
    stats: JSON.stringify(analysis.stats),
    createdAt: new Date(project.createdAt),
  });

  const timelineRows = analysis.timeline.map((point) => ({
    projectId: project.id,
    t: point.t,
    score: point.score,
    energy: point.energy,
    motion: point.motion,
    recordedAt: Date.now() / 1000,
  }));

  try {
    for (let i = 0; i < timelineRows.length; i += TIMELINE_BATCH_SIZE) {
      await timelineDb
        .insert(timelinePoints)
        .values(timelineRows.slice(i, i + TIMELINE_BATCH_SIZE));
    }
  } catch (error) {
    await db.delete(projects).where(eq(projects.id, project.id));
    throw error;
  }

  return project;
}

export async function findProjectWithAnalysis(
  id: string,
): Promise<{ project: Project; analysis: VideoAnalysis } | null> {
  const db = await requireNeonDb();
  const timelineDb = await getTimelineDb();

  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!row) return null;

  const project = rowToProject(row);

  const timelineRows = await timelineDb
    .select()
    .from(timelinePoints)
    .where(eq(timelinePoints.projectId, id))
    .orderBy(asc(timelinePoints.t));

  const timeline = timelineRows.map(rowToTimelinePoint);
  const analysis = parseStoredAnalysis(project, row, timeline);
  if (!analysis) return null;

  return { project, analysis };
}

export async function loadProjectAnalysis(
  project: Project,
): Promise<VideoAnalysis | null> {
  const result = await findProjectWithAnalysis(project.id);
  return result?.analysis ?? null;
}
