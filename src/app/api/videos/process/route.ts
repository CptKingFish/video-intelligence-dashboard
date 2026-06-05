import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { isNeonEnabled } from "@/lib/env";
import {
  findCanonicalByUploadthingKey,
  findProjectByOwnerAndKey,
  findProjectWithAnalysis,
  saveProjectWithAnalysis,
} from "@/lib/projects";
import { gradientThumbnail } from "@/lib/thumbnails";
import { getVideoSample } from "@/lib/videos/samples";
import type { ApiResponse, Project } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/videos/process
 *
 * Accepts a curated sample id, clones seeded TRIBE analysis for the user,
 * and persists to Neon (+ Timescale for projections when configured).
 */
const requestSchema = z.object({
  sampleId: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(120).optional(),
  durationSeconds: z.number().int().nonnegative().max(60 * 60 * 6).default(0),
  thumbnailUrl: z.string().min(1).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!isNeonEnabled) {
    return json(
      {
        success: false,
        error:
          "DATABASE_URL is not configured. Add your Neon connection string to .env.local.",
      },
      503,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
      422,
    );
  }

  const user = await getCurrentUser();
  const input = parsed.data;
  const sample = getVideoSample(input.sampleId);

  if (!sample) {
    return json({ success: false, error: "Unknown sample id." }, 422);
  }

  const { uploadthingKey } = sample;

  const existing = await findProjectByOwnerAndKey(user.id, uploadthingKey);
  if (existing) {
    const loaded = await findProjectWithAnalysis(existing.id);
    if (loaded) {
      return json({ success: true, data: loaded }, 200);
    }
  }

  const canonical = await findCanonicalByUploadthingKey(uploadthingKey);
  if (!canonical) {
    return json(
      {
        success: false,
        error:
          "Seeded analysis not found for this video. Run pnpm db:seed after migrating.",
      },
      503,
    );
  }

  const id = uuidv4();
  const title = input.title?.trim() || sample.title;
  const project: Project = {
    id,
    uploadthingKey,
    ownerId: user.id,
    title,
    thumbnailUrl: input.thumbnailUrl || gradientThumbnail(id, title),
    videoUrl: sample.videoUrl,
    status: "ready",
    durationSeconds: canonical.project.durationSeconds,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveProjectWithAnalysis(
      project,
      canonical.analysis,
      canonical.projections,
    );
  } catch (error) {
    console.error("[videos/process] failed to persist project", error);
    return json(
      {
        success: false,
        error:
          "Failed to save project. Run database migrations (pnpm db:migrate).",
      },
      500,
    );
  }

  const loaded = await findProjectWithAnalysis(id);
  if (!loaded) {
    return json(
      { success: false, error: "Project saved but analysis could not be loaded." },
      500,
    );
  }

  return json({ success: true, data: loaded }, 201);
}

function json<T>(body: ApiResponse<T>, status: number): NextResponse {
  return NextResponse.json(body, { status });
}
