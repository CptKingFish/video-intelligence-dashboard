import type { Project } from "@/lib/types";
import { generateAnalysis } from "@/lib/mock/analysis";
import { gradientThumbnail } from "@/lib/mock/thumbnails";

/**
 * In-memory project store for demo mode.
 *
 * This stands in for the Neon (relational) repository. It is intentionally
 * process-local: new uploads added during a session are visible until the
 * server restarts. Swap `projectRepository` (lib/db/repository.ts) to the
 * Neon-backed implementation once `DATABASE_URL` is configured.
 */

const DEMO_OWNER = "demo-user";

const SEED_TITLES: ReadonlyArray<[string, string, string]> = [
  // ["a1f3c9d2-0b7e-4d1a-9c2f-1e6b8a4d7c10", "Product Launch Teaser"],
  // ["b2e4d8a1-7c3f-49b2-8a1d-2f7c9b5e6d21", "Conference Keynote"],
  // ["c3f5e7b0-6d2e-4a93-7b0c-3a8d6c4f5e32", "Travel Vlog — Kyoto"],
  // ["d4a6f6c9-5e1d-4b84-6c9b-4b9e5d3a6f43", "Highlight Reel 2026"],
  [
    "8f3b7d21-6c4a-4e95-a7d2-91b5c8e4f6a3",
    "VR Game Trailer",
    "AyUNh764T5K802tdvikJ2h8barDHoP3X17xvWVzeSnQO4msY",
  ],
];

function seedProject(
  id: string,
  title: string,
  ut_id: string,
  offsetDays: number,
): Project {
  const analysis = generateAnalysis(id);
  // Stable creation timestamps relative to a fixed epoch (no Date.now at
  // module load → consistent ordering without nondeterminism concerns).
  const created = new Date("2026-05-01T12:00:00Z");
  created.setUTCDate(created.getUTCDate() + offsetDays);

  return {
    id,
    ownerId: DEMO_OWNER,
    title,
    thumbnailUrl: gradientThumbnail(id, title),
    videoUrl: `https://utfs.io/f/${ut_id}`,
    status: "ready",
    durationSeconds: analysis.durationSeconds,
    fileSizeBytes: 18_000_000 + (offsetDays + 1) * 7_400_000,
    embeddingDim: analysis.embeddingDim,
    createdAt: created.toISOString(),
  };
}

// Module-level singleton, resilient to Next.js dev hot-reload.
const globalForStore = globalThis as unknown as {
  __videoProjects?: Map<string, Project>;
};

function getStore(): Map<string, Project> {
  if (!globalForStore.__videoProjects) {
    const store = new Map<string, Project>();
    SEED_TITLES.forEach(([id, title, ut_id], index) => {
      store.set(id, seedProject(id, title, ut_id, index * 6));
    });
    globalForStore.__videoProjects = store;
  }
  return globalForStore.__videoProjects;
}

export function listProjects(ownerId: string = DEMO_OWNER): Project[] {
  return Array.from(getStore().values())
    .filter((project) => project.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getProject(id: string): Project | null {
  return getStore().get(id) ?? null;
}

export function createProject(project: Project): Project {
  getStore().set(project.id, project);
  return project;
}

export { DEMO_OWNER };
