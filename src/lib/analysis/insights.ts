import type {
  EditCopilot,
  TimelinePoint,
  VideoInsights,
  ViralSimulator,
} from "@/lib/types";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function sliceAverage(timeline: TimelinePoint[], start: number, end: number): number {
  const slice = timeline.filter((p) => p.t >= start && p.t < end);
  if (slice.length === 0) return 0;
  return slice.reduce((acc, p) => acc + p.score, 0) / slice.length;
}

function sceneChangeScore(timeline: TimelinePoint[]): number {
  if (timeline.length < 2) return 0;
  let changes = 0;
  for (let i = 1; i < timeline.length; i++) {
    if (Math.abs(timeline[i].score - timeline[i - 1].score) > 0.12) {
      changes += 1;
    }
  }
  return clamp01(changes / Math.max(timeline.length - 1, 1));
}

function hookScore(timeline: TimelinePoint[]): number {
  const hookWindow = timeline.filter((p) => p.t <= 3);
  if (hookWindow.length === 0) return 0;
  const peak = hookWindow.reduce((acc, p) => Math.max(acc, p.score), 0);
  const avgMotion =
    hookWindow.reduce((acc, p) => acc + p.motion, 0) / hookWindow.length;
  return clamp01(peak * 0.7 + avgMotion * 0.3);
}

function starsFromScore(score: number): number {
  if (score >= 0.88) return 5;
  if (score >= 0.72) return 4;
  if (score >= 0.55) return 3;
  if (score >= 0.38) return 2;
  return 1;
}

function buildViralSimulator(
  timeline: TimelinePoint[],
  durationSeconds: number,
): ViralSimulator {
  const engagementScore = clamp01(
    timeline.reduce((acc, p) => acc + p.score, 0) / Math.max(timeline.length, 1),
  );
  const motionScore = clamp01(
    timeline.reduce((acc, p) => acc + p.motion, 0) / Math.max(timeline.length, 1),
  );
  const sceneChange = sceneChangeScore(timeline);
  const hook = hookScore(timeline);

  let tiktok = engagementScore * 55 + hook * 25 + motionScore * 20;
  let instagram = engagementScore * 50 + sceneChange * 30 + hook * 20;
  let youtube = engagementScore * 45 + hook * 35 + motionScore * 20;

  if (hook > 0.8) tiktok += 20;
  if (motionScore > 0.65) tiktok += 10;
  if (sceneChange > 0.5) instagram += 12;
  if (hook > 0.7 && durationSeconds <= 20) youtube += 15;

  const normalize = (raw: number) => clamp01(raw / 100);

  const platforms = [
    { platform: "tiktok" as const, label: "TikTok", raw: tiktok },
    {
      platform: "instagram_reels" as const,
      label: "Instagram Reels",
      raw: instagram,
    },
    {
      platform: "youtube_shorts" as const,
      label: "YouTube Shorts",
      raw: youtube,
    },
  ].map(({ platform, label, raw }) => {
    const score = normalize(raw);
    return { platform, label, stars: starsFromScore(score), score };
  });

  const early = sliceAverage(timeline, 0, 3);
  const mid = sliceAverage(timeline, 3, 10);
  const late = sliceAverage(timeline, 10, Math.min(20, durationSeconds));

  const dropOff = [
    {
      range: "0–3s",
      dropOffPercent: Math.round((1 - early) * 38 + 12),
    },
    {
      range: "3–10s",
      dropOffPercent: Math.round((1 - mid) * 22 + 8),
    },
    {
      range: "10–20s",
      dropOffPercent: Math.round((1 - late) * 8 + 4),
    },
  ];

  const brainResponseScore = Math.round(
    (engagementScore * 0.35 + hook * 0.35 + motionScore * 0.2 + sceneChange * 0.1) *
      100,
  );

  const audiences = [
    {
      label: "Students (18–24)",
      response:
        hook > 0.65 ? ("high" as const) : ("medium" as const),
    },
    {
      label: "Professionals (25–34)",
      response:
        engagementScore > 0.6 ? ("medium" as const) : ("low" as const),
    },
    {
      label: "Gamers",
      response:
        motionScore > 0.62 ? ("very_high" as const) : ("high" as const),
    },
  ];

  return {
    brainResponseScore,
    platforms,
    dropOff,
    audiences,
    signals: {
      engagementScore: Number(engagementScore.toFixed(3)),
      motionScore: Number(motionScore.toFixed(3)),
      sceneChangeScore: Number(sceneChange.toFixed(3)),
      hookScore: Number(hook.toFixed(3)),
    },
  };
}

function buildEditCopilot(timeline: TimelinePoint[]): EditCopilot {
  const hooks = [
    "Nobody told me this before…",
    "Stop scrolling — this changes everything.",
    "I tried this so you don't have to.",
    "POV: you finally understand why this works.",
  ];
  const brollIdeas = [
    "person running",
    "explosion transition",
    "before/after split screen",
    "macro product shot",
    "crowd reaction cutaway",
  ];

  const windowSize = 2;
  const weak: { start: number; end: number; avg: number }[] = [];

  for (let start = 0; start < timeline.length - 1; start += windowSize) {
    const end = start + windowSize;
    const slice = timeline.filter((p) => p.t >= start && p.t < end);
    if (slice.length === 0) continue;
    const avg = slice.reduce((acc, p) => acc + p.score, 0) / slice.length;
    weak.push({ start, end, avg });
  }

  weak.sort((a, b) => a.avg - b.avg);
  const picks = weak.slice(0, 2);

  const weakSegments = picks.map((segment, index) => ({
    start: segment.start,
    end: segment.end,
    problem:
      segment.avg < 0.35
        ? "Low neural attention"
        : "Attention dip — pacing stalls",
    suggestions: [
      { action: "Zoom into subject" },
      { action: "Add subtitle hook" },
      { action: segment.start < 2 ? "Cut first 0.8s" : "Increase motion" },
      { action: "Add visual surprise" },
    ],
    alternativeHook: hooks[index % hooks.length],
    suggestedBroll: brollIdeas.slice(index, index + 3),
  }));

  return { weakSegments };
}

export function buildVideoInsights(
  timeline: TimelinePoint[],
  durationSeconds: number,
): VideoInsights {
  return {
    viralSimulator: buildViralSimulator(timeline, durationSeconds),
    editCopilot: buildEditCopilot(timeline),
  };
}

/** Score a sample for neural A/B comparison (0–100). */
export function abTestScore(
  timeline: TimelinePoint[],
  durationSeconds: number,
): number {
  const sim = buildViralSimulator(timeline, durationSeconds);
  const peak = timeline.reduce((acc, p) => Math.max(acc, p.score), 0);
  return Math.round(
    sim.brainResponseScore * 0.55 +
      sim.signals.hookScore * 100 * 0.25 +
      peak * 100 * 0.2,
  );
}
