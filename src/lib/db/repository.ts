import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import {
  getNeonDb,
  getTimescaleDb,
  isTimescaleReachable,
} from "@/lib/db/clients";
import {
  parseStoredAnalysis,
  rowToProject,
  rowToStimProjection,
} from "@/lib/db/mappers";
import { projects, stimProjections } from "@/lib/db/schema";
import { withDbRetry } from "@/lib/db/retry";
import type {
  Project,
  StimProjectionPoint,
  VideoAnalysis,
  VideoAnalysisSchema,
} from "@/lib/types";

const PROJECTION_BATCH_SIZE = 500;

async function requireNeonDb() {
  const db = await getNeonDb();
  if (!db) {
    throw new Error(
      "DATABASE_URL is required. Configure your Neon connection string in .env.local.",
    );
  }
  return db;
}

/** Projection rows live in Timescale when configured and reachable, otherwise Neon. */
async function getProjectionDb() {
  if (await isTimescaleReachable()) {
    const timescale = await getTimescaleDb();
    if (timescale) return timescale;
  }
  return requireNeonDb();
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  const db = await requireNeonDb();
  const rows = await withDbRetry(() =>
    db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, ownerId))
      .orderBy(desc(projects.createdAt)),
  );

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

export async function findProjectByUploadthingKey(
  uploadthingKey: string,
): Promise<Project | null> {
  const db = await requireNeonDb();
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.uploadthingKey, uploadthingKey))
    .limit(1);

  return row ? rowToProject(row) : null;
}

export async function findProjectByOwnerAndKey(
  ownerId: string,
  uploadthingKey: string,
): Promise<Project | null> {
  const db = await requireNeonDb();
  const [row] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.ownerId, ownerId),
        eq(projects.uploadthingKey, uploadthingKey),
      ),
    )
    .limit(1);

  return row ? rowToProject(row) : null;
}

export async function findCanonicalByUploadthingKey(
  uploadthingKey: string,
): Promise<{
  project: Project;
  analysis: VideoAnalysisSchema;
  projections: StimProjectionPoint[];
} | null> {
  const db = await requireNeonDb();
  const projectionDb = await getProjectionDb();

  const [row] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.uploadthingKey, uploadthingKey),
        eq(projects.ownerId, "seed"),
      ),
    )
    .limit(1);

  if (!row) return null;

  const projectionRows = await projectionDb
    .select()
    .from(stimProjections)
    .where(eq(stimProjections.projectId, row.id))
    .orderBy(asc(stimProjections.timestep));

  return {
    project: rowToProject(row),
    analysis: row.analysis as VideoAnalysisSchema,
    projections: projectionRows.map(rowToStimProjection),
  };
}

export async function insertProjectWithAnalysis(
  project: Project,
  analysisSchema: VideoAnalysisSchema,
  projections: StimProjectionPoint[],
): Promise<Project> {
  const db = await requireNeonDb();
  const projectionDb = await getProjectionDb();

  await db.insert(projects).values({
    id: project.id,
    uploadthingKey: project.uploadthingKey,
    ownerId: project.ownerId,
    title: project.title,
    thumbnailUrl: project.thumbnailUrl,
    videoUrl: project.videoUrl,
    status: project.status,
    durationSeconds: project.durationSeconds,
    analysis: analysisSchema,
    createdAt: new Date(project.createdAt),
  });

  const projectionRows = projections.map((point) => ({
    projectId: project.id,
    timestep: point.timestep,
    timeSec: point.timeSec,
    stimProjection: point.stimProjection,
    cosineToStim: point.cosineToStim,
  }));

  try {
    for (let i = 0; i < projectionRows.length; i += PROJECTION_BATCH_SIZE) {
      await projectionDb
        .insert(stimProjections)
        .values(projectionRows.slice(i, i + PROJECTION_BATCH_SIZE));
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
  const projectionDb = await getProjectionDb();

  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!row) return null;

  const project = rowToProject(row);

  const projectionRows = await projectionDb
    .select()
    .from(stimProjections)
    .where(eq(stimProjections.projectId, id))
    .orderBy(asc(stimProjections.timestep));

  const projections = projectionRows.map(rowToStimProjection);
  const analysis = parseStoredAnalysis(project, row, projections);
  if (!analysis) return null;

  return { project, analysis };
}

export async function loadProjectAnalysis(
  project: Project,
): Promise<VideoAnalysis | null> {
  const result = await findProjectWithAnalysis(project.id);
  return result?.analysis ?? null;
}

export async function deleteProjectByUploadthingKey(
  uploadthingKey: string,
): Promise<void> {
  const db = await requireNeonDb();
  const projectionDb = await getProjectionDb();

  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.uploadthingKey, uploadthingKey))
    .limit(1);

  if (!row) return;

  await projectionDb
    .delete(stimProjections)
    .where(eq(stimProjections.projectId, row.id));
  await db.delete(projects).where(eq(projects.id, row.id));
}
