import "server-only";

import type { Project, VideoAnalysis } from "@/lib/types";
import { generateAnalysis } from "@/lib/mock/analysis";
import * as mockStore from "@/lib/mock/store";
import { isNeonEnabled } from "@/lib/env";

/**
 * Project data-access facade (Repository pattern).
 *
 * Today every method delegates to the in-memory mock store. When
 * `DATABASE_URL` is set, swap these bodies for the Neon-backed queries in
 * `lib/db/clients.ts` — the call sites in the app never change.
 */

export async function getProjects(ownerId: string): Promise<Project[]> {
  if (isNeonEnabled) {
    // TODO(neon): `return getNeonDb().select().from(projects).where(eq(projects.ownerId, ownerId))`
  }
  return mockStore.listProjects(ownerId);
}

export async function findProject(id: string): Promise<Project | null> {
  if (isNeonEnabled) {
    // TODO(neon): query by primary key.
  }
  return mockStore.getProject(id);
}

export async function saveProject(project: Project): Promise<Project> {
  if (isNeonEnabled) {
    // TODO(neon): upsert into `projects`.
  }
  return mockStore.createProject(project);
}

/**
 * Load the full analysis for a project. In demo mode this is regenerated
 * deterministically from the project id; with Timescale configured this would
 * read the persisted `timeline_points` hypertable + the stored embedding.
 */
export async function getProjectAnalysis(
  project: Project,
): Promise<VideoAnalysis> {
  return generateAnalysis(project.id, {
    durationSeconds: project.durationSeconds || undefined,
    embeddingDim: project.embeddingDim || undefined,
  });
}
