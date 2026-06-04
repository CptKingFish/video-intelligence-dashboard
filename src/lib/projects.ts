import "server-only";

import { unstable_cache } from "next/cache";

import * as repository from "@/lib/db/repository";
import type { Project, VideoAnalysis } from "@/lib/types";

export async function getProjects(ownerId: string): Promise<Project[]> {
  return repository.listProjects(ownerId);
}

export async function findProject(id: string): Promise<Project | null> {
  return repository.findProjectById(id);
}

/** Analysis is immutable after upload — cache across requests to avoid repeat DB reads. */
export function findProjectWithAnalysis(id: string) {
  return unstable_cache(
    () => repository.findProjectWithAnalysis(id),
    ["project-with-analysis", id],
    { revalidate: 86_400, tags: [`project-${id}`] },
  )();
}

export async function saveProjectWithAnalysis(
  project: Project,
  analysis: VideoAnalysis,
): Promise<Project> {
  return repository.insertProjectWithAnalysis(project, analysis);
}

export async function getProjectAnalysis(
  project: Project,
): Promise<VideoAnalysis | null> {
  return repository.loadProjectAnalysis(project);
}
