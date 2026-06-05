import type { ProjectRow, StimProjectionRow } from "@/lib/db/schema";
import { buildVideoInsights } from "@/lib/analysis/insights";
import {
  buildBrainScanFromStored,
  buildEditCopilotFromAnalysis,
  parseTimestamp,
  sampleCosineAtTime,
} from "@/lib/analysis/brain-scan";
import type {
  Highlight,
  Project,
  StimProjectionPoint,
  TimelinePoint,
  VideoAnalysis,
  VideoAnalysisSchema,
} from "@/lib/types";

export function rowToProject(row: ProjectRow): Project {
  const analysis = row.analysis as VideoAnalysisSchema;
  return {
    id: row.id,
    uploadthingKey: row.uploadthingKey,
    ownerId: row.ownerId,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl,
    videoUrl: row.videoUrl,
    status: row.status,
    durationSeconds: row.durationSeconds,
    createdAt: row.createdAt.toISOString(),
    brainResponseScore: analysis?.brain_response_score,
  };
}

export function rowToStimProjection(row: StimProjectionRow): StimProjectionPoint {
  return {
    timestep: row.timestep,
    timeSec: row.timeSec,
    stimProjection: row.stimProjection,
    cosineToStim: row.cosineToStim,
  };
}

function buildTimelineFromAnalysis(
  analysis: VideoAnalysisSchema,
  projections: StimProjectionPoint[],
): TimelinePoint[] {
  return analysis.stimulation_timeline.map((point, index) => {
    const baseT = parseTimestamp(point.timestamp);
    const duplicateCount = analysis.stimulation_timeline
      .slice(0, index)
      .filter((p) => p.timestamp === point.timestamp).length;
    const t = baseT + duplicateCount * 0.01;

    const cosine = sampleCosineAtTime(projections, t);
    return {
      t,
      score: point.score / 100,
      energy: cosine,
      motion: cosine,
    };
  });
}

function detectHighlightsFromTimeline(timeline: TimelinePoint[]): Highlight[] {
  const threshold = 0.75;
  const highlights: Highlight[] = [];

  for (let i = 0; i < timeline.length; i++) {
    const point = timeline[i];
    if (point.score < threshold) continue;

    const prev = timeline[i - 1];
    const next = timeline[i + 1];
    if (prev && prev.score >= threshold) continue;
    if (next && next.score >= point.score) continue;

    highlights.push({
      id: `hl-${point.t.toFixed(2)}`,
      start: point.t,
      end: point.t + 1,
      peak: point.score,
      label: "Peak stimulation",
    });
  }

  return highlights.slice(0, 8);
}

export function parseStoredAnalysis(
  project: Project,
  row: ProjectRow,
  projections: StimProjectionPoint[],
): VideoAnalysis | null {
  const analysis = row.analysis as VideoAnalysisSchema;
  if (!analysis?.stimulation_timeline) return null;

  const timeline = buildTimelineFromAnalysis(analysis, projections);
  const highlights = detectHighlightsFromTimeline(timeline);
  const insights = buildVideoInsights(timeline, row.durationSeconds);
  insights.editCopilot = buildEditCopilotFromAnalysis(analysis);
  insights.viralSimulator.brainResponseScore = analysis.brain_response_score;

  return {
    projectId: project.id,
    durationSeconds: row.durationSeconds,
    timeline,
    highlights,
    stats: {
      averageScore: Number((analysis.mean_stimulation / 100).toFixed(3)),
      peakScore: Number((analysis.peak_stimulation / 100).toFixed(3)),
      highlightCount: analysis.highlights,
      engagementIndex: Number(
        (analysis.brain_response_score / 100).toFixed(3),
      ),
    },
    insights,
    brainScan: buildBrainScanFromStored(analysis, projections),
  };
}

export function buildPersistPayload(
  analysis: VideoAnalysisSchema,
  projections: StimProjectionPoint[],
): { analysis: VideoAnalysisSchema; projections: StimProjectionPoint[] } {
  return { analysis, projections };
}
