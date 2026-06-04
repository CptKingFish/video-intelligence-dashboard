import type {
  Highlight,
  TimelinePoint,
  VideoAnalysis,
} from "@/lib/types";

/**
 * Deterministic analysis generator used until `EMBEDDING_SERVICE_URL` is wired.
 * Output is derived from the project id so processing is stable across reloads.
 */

/** Mulberry32 — small, fast, deterministic PRNG. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function buildTimeline(
  rng: () => number,
  durationSeconds: number,
): TimelinePoint[] {
  const peakCount = 3 + Math.floor(rng() * 4);
  const peaks = Array.from({ length: peakCount }, () => ({
    center: rng() * durationSeconds,
    width: 4 + rng() * 12,
    height: 0.55 + rng() * 0.45,
  }));

  const points: TimelinePoint[] = [];
  let energyWalk = 0.4;
  let motionWalk = 0.4;

  for (let t = 0; t <= durationSeconds; t++) {
    const peakScore = peaks.reduce((acc, peak) => {
      const distance = t - peak.center;
      return (
        acc +
        peak.height *
          Math.exp(-(distance * distance) / (2 * peak.width * peak.width))
      );
    }, 0);

    energyWalk = clamp01(energyWalk + (rng() - 0.5) * 0.18);
    motionWalk = clamp01(motionWalk + (rng() - 0.5) * 0.22);

    const noise = (rng() - 0.5) * 0.06;
    points.push({
      t,
      score: clamp01(peakScore + noise),
      energy: clamp01(energyWalk * 0.7 + peakScore * 0.3),
      motion: clamp01(motionWalk * 0.6 + peakScore * 0.4),
    });
  }
  return points;
}

function detectHighlights(timeline: TimelinePoint[]): Highlight[] {
  const threshold = 0.55;
  const labels = [
    "Hook moment",
    "High engagement",
    "Peak intensity",
    "Visual climax",
    "Audio spike",
    "Standout segment",
  ];

  const highlights: Highlight[] = [];
  let segmentStart: number | null = null;
  let segmentPeak = 0;

  const flush = (endT: number) => {
    if (segmentStart === null) return;
    if (endT - segmentStart >= 1) {
      highlights.push({
        id: `hl-${segmentStart}-${endT}`,
        start: segmentStart,
        end: endT,
        peak: Number(segmentPeak.toFixed(3)),
        label: labels[highlights.length % labels.length],
      });
    }
    segmentStart = null;
    segmentPeak = 0;
  };

  for (const point of timeline) {
    if (point.score >= threshold) {
      if (segmentStart === null) segmentStart = point.t;
      segmentPeak = Math.max(segmentPeak, point.score);
    } else {
      flush(point.t);
    }
  }
  flush(timeline[timeline.length - 1]?.t ?? 0);

  return highlights
    .sort((a, b) => b.peak - a.peak)
    .slice(0, 6)
    .sort((a, b) => a.start - b.start);
}

function buildEmbedding(rng: () => number, dim: number): number[] {
  return Array.from({ length: dim }, () => Number((rng() * 2 - 1).toFixed(4)));
}

export interface GenerateAnalysisOptions {
  durationSeconds?: number;
  embeddingDim?: number;
}

export function generateAnalysis(
  projectId: string,
  options: GenerateAnalysisOptions = {},
): VideoAnalysis {
  const rng = createRng(hashSeed(projectId));
  const durationSeconds =
    options.durationSeconds ?? 45 + Math.floor(rng() * 200);
  const embeddingDim = options.embeddingDim ?? 512;

  const timeline = buildTimeline(rng, durationSeconds);
  const highlights = detectHighlights(timeline);
  const embedding = buildEmbedding(rng, embeddingDim);

  const averageScore =
    timeline.reduce((acc, p) => acc + p.score, 0) / timeline.length;
  const peakScore = timeline.reduce((acc, p) => Math.max(acc, p.score), 0);

  return {
    projectId,
    embedding,
    embeddingDim,
    durationSeconds,
    timeline,
    highlights,
    stats: {
      averageScore: Number(averageScore.toFixed(3)),
      peakScore: Number(peakScore.toFixed(3)),
      highlightCount: highlights.length,
      engagementIndex: Number(
        (averageScore * 0.6 + peakScore * 0.4).toFixed(3),
      ),
    },
  };
}
