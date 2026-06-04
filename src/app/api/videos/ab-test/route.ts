import { NextResponse } from "next/server";
import { z } from "zod";

import { abTestScore, buildVideoInsights } from "@/lib/analysis/insights";
import { generateAnalysis } from "@/lib/analysis/generate";
import type { AbTestResult, ApiResponse } from "@/lib/types";
import { getVideoSample, isValidSampleId } from "@/lib/videos/samples";

export const runtime = "nodejs";

const requestSchema = z.object({
  sampleIds: z.array(z.string().trim().min(1)).min(2).max(3),
});

/**
 * POST /api/videos/ab-test
 *
 * Compares 2–3 curated samples with deterministic TRIBE-style heuristics
 * (no publish required).
 */
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
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
      422,
    );
  }

  const uniqueIds = [...new Set(parsed.data.sampleIds)];
  if (uniqueIds.some((id) => !isValidSampleId(id))) {
    return json({ success: false, error: "Unknown sample id in list." }, 422);
  }

  const candidates = uniqueIds.map((sampleId) => {
    const sample = getVideoSample(sampleId)!;
    const analysis = generateAnalysis(`ab-${sampleId}`, {
      durationSeconds: sample.durationSeconds,
    });
    const score = abTestScore(analysis.timeline, analysis.durationSeconds);
    const insights = buildVideoInsights(
      analysis.timeline,
      analysis.durationSeconds,
    );
    return {
      sampleId,
      title: sample.title,
      score,
      hookScore: insights.viralSimulator.signals.hookScore,
      peakAttention: analysis.stats.peakScore,
      dropOffLate: insights.viralSimulator.dropOff[2]?.dropOffPercent ?? 0,
    };
  });

  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];
  const runnerUp = candidates[1];
  const margin = winner.score - (runnerUp?.score ?? 0);
  const confidencePercent = Math.min(97, Math.max(62, 70 + margin));

  const reasons: string[] = [];
  if (winner.hookScore >= 0.7) reasons.push("Strongest opening hook.");
  if (winner.peakAttention >= 0.65) reasons.push("Highest peak attention.");
  if (winner.dropOffLate <= 12) reasons.push("Lowest predicted drop-off.");

  const result: AbTestResult = {
    winnerSampleId: winner.sampleId,
    winnerTitle: winner.title,
    confidencePercent,
    reason: reasons.join(" ") || "Highest composite brain-response score.",
    candidates: candidates.map(({ sampleId, title, score }) => ({
      sampleId,
      title,
      score,
    })),
  };

  return json({ success: true, data: result }, 200);
}

function json<T>(body: ApiResponse<T>, status: number): NextResponse {
  return NextResponse.json(body, { status });
}
