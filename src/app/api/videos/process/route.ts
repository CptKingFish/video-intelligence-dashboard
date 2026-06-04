import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { buildVideoInsights } from "@/lib/analysis/insights";
import { generateAnalysis } from "@/lib/analysis/generate";
import { getCurrentUser } from "@/lib/auth";
import { embeddingServiceUrl, isNeonEnabled } from "@/lib/env";
import { saveProjectWithAnalysis } from "@/lib/projects";
import { gradientThumbnail } from "@/lib/thumbnails";
import { getVideoSample } from "@/lib/videos/samples";
import type { ApiResponse, Project, VideoAnalysis } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/videos/process
 *
 * Accepts video metadata (captured client-side), runs analysis, persists to
 * Neon (+ Timescale for timeline when configured), and returns project + analysis.
 */
const requestSchema = z
  .object({
    sampleId: z.string().trim().min(1).max(64).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    durationSeconds: z.number().int().nonnegative().max(60 * 60 * 6).default(0),
    fileSizeBytes: z.number().int().nonnegative().default(0),
    thumbnailUrl: z.string().min(1).optional(),
    videoUrl: z.string().optional(),
    embeddingDim: z.number().int().min(8).max(4096).default(512),
  })
  .refine((data) => !!data.sampleId || !!data.title, {
    message: "Provide sampleId or title.",
    path: ["sampleId"],
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
  const sample = input.sampleId ? getVideoSample(input.sampleId) : undefined;

  if (input.sampleId && !sample) {
    return json({ success: false, error: "Unknown sample id." }, 422);
  }

  const id = uuidv4();
  const title = sample?.title ?? input.title!.trim();
  const durationSeed = sample?.durationSeconds ?? input.durationSeconds;

  const analysis: VideoAnalysis = embeddingServiceUrl
    ? await fetchExternalAnalysis(id, { ...input, durationSeconds: durationSeed })
    : generateAnalysis(id, {
        durationSeconds: durationSeed || undefined,
        embeddingDim: input.embeddingDim,
      });

  const project: Project = {
    id,
    ownerId: user.id,
    title,
    thumbnailUrl:
      input.thumbnailUrl || gradientThumbnail(id, title),
    videoUrl: sample?.videoUrl ?? input.videoUrl ?? null,
    status: "ready",
    durationSeconds: analysis.durationSeconds,
    fileSizeBytes: input.fileSizeBytes,
    embeddingDim: analysis.embeddingDim,
    sampleId: sample?.id ?? null,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveProjectWithAnalysis(project, analysis);
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

  return json({ success: true, data: { project, analysis } }, 201);
}

async function fetchExternalAnalysis(
  projectId: string,
  input: z.infer<typeof requestSchema>,
): Promise<VideoAnalysis> {
  const response = await fetch(embeddingServiceUrl!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      durationSeconds: input.durationSeconds,
      embeddingDim: input.embeddingDim,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding service returned ${response.status}`);
  }

  const raw = (await response.json()) as VideoAnalysis;
  if (raw.insights) return raw;
  return {
    ...raw,
    insights: buildVideoInsights(raw.timeline, raw.durationSeconds),
  };
}

function json<T>(body: ApiResponse<T>, status: number): NextResponse {
  return NextResponse.json(body, { status });
}
