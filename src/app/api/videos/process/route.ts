import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import type { ApiResponse, Project, VideoAnalysis } from "@/lib/types";
import { generateAnalysis } from "@/lib/mock/analysis";
import { gradientThumbnail } from "@/lib/mock/thumbnails";
import { saveProject } from "@/lib/projects";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/videos/process
 *
 * Accepts video metadata (captured client-side), assigns a UUID, runs the
 * "embedding + timeline" analysis, persists the project, and returns the
 * project together with its analysis.
 *
 * MOCK: the embedding/timeline are generated deterministically here. To go
 * live, forward the uploaded MP4 to `EMBEDDING_SERVICE_URL` and map its
 * response (a `number[]` vector embedding) into the same `VideoAnalysis`
 * shape — the rest of the app is unchanged.
 */
const requestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  durationSeconds: z.number().int().nonnegative().max(60 * 60 * 6).default(0),
  fileSizeBytes: z.number().int().nonnegative().default(0),
  /** Captured first-frame data URL, or remote URL. */
  thumbnailUrl: z.string().min(1).optional(),
  /** Client object URL (blob:) for in-session playback, optional. */
  videoUrl: z.string().optional(),
  embeddingDim: z.number().int().min(8).max(4096).default(512),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      422,
    );
  }

  const user = await getCurrentUser();
  const input = parsed.data;
  const id = uuidv4();

  const analysis: VideoAnalysis = generateAnalysis(id, {
    durationSeconds: input.durationSeconds || undefined,
    embeddingDim: input.embeddingDim,
  });

  const project: Project = {
    id,
    ownerId: user.id,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl || gradientThumbnail(id, input.title),
    videoUrl: input.videoUrl ?? null,
    status: "ready",
    durationSeconds: analysis.durationSeconds,
    fileSizeBytes: input.fileSizeBytes,
    embeddingDim: analysis.embeddingDim,
    createdAt: new Date().toISOString(),
  };

  await saveProject(project);

  return json({ success: true, data: { project, analysis } }, 201);
}

function json<T>(body: ApiResponse<T>, status: number): NextResponse {
  return NextResponse.json(body, { status });
}
