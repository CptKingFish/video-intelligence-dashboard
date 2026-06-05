import type {
  BrainActivationPoint,
  BrainScan,
  EditCopilot,
  StimProjectionPoint,
  VideoAnalysisSchema,
} from "@/lib/types";

/** Linearly interpolate the activation series at an arbitrary time (seconds). */
export function sampleActivation(
  activation: BrainActivationPoint[],
  time: number,
): number {
  if (activation.length === 0) return 0;
  if (time <= activation[0].t) return activation[0].activation;
  const last = activation[activation.length - 1];
  if (time >= last.t) return last.activation;

  for (let i = 1; i < activation.length; i++) {
    const a = activation[i - 1];
    const b = activation[i];
    if (time <= b.t) {
      const span = b.t - a.t || 1;
      const f = (time - a.t) / span;
      return a.activation + (b.activation - a.activation) * f;
    }
  }
  return last.activation;
}

/** Parse an "m:ss" / "0:55" timestamp into seconds. */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((acc, value) => acc * 60 + value, 0);
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Sample cosine_to_stim at an arbitrary time from projection rows. */
export function sampleCosineAtTime(
  projections: StimProjectionPoint[],
  time: number,
): number {
  if (projections.length === 0) return 0;
  if (time <= projections[0].timeSec) return projections[0].cosineToStim;
  const last = projections[projections.length - 1];
  if (time >= last.timeSec) return last.cosineToStim;

  for (let i = 1; i < projections.length; i++) {
    const a = projections[i - 1];
    const b = projections[i];
    if (time <= b.timeSec) {
      const span = b.timeSec - a.timeSec || 1;
      const f = (time - a.timeSec) / span;
      return a.cosineToStim + (b.cosineToStim - a.cosineToStim) * f;
    }
  }
  return last.cosineToStim;
}

function buildActivationFromProjections(
  projections: StimProjectionPoint[],
): BrainActivationPoint[] {
  if (projections.length === 0) return [];

  const values = projections.map((p) => p.stimProjection);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return projections.map((p) => ({
    t: p.timeSec,
    projection: p.stimProjection,
    activation: clamp01((p.stimProjection - min) / span),
  }));
}

/** Normalized predicted-brain-response payload from stored TRIBE data. */
export function buildBrainScanFromStored(
  analysis: VideoAnalysisSchema,
  projections: StimProjectionPoint[],
): BrainScan {
  return {
    activation: buildActivationFromProjections(projections),
    meanStimulation: analysis.mean_stimulation,
    peakStimulation: analysis.peak_stimulation,
    brainResponseScore: analysis.brain_response_score,
    stimulatingMoment: {
      event: analysis.stimulating_moment.event,
      t: parseTimestamp(analysis.stimulating_moment.timestamp),
    },
    predictedDropOff: analysis.predicted_drop_off.map(parseTimestamp),
    audienceSegment: analysis.audience_segment,
  };
}

/** Adapt stored `suggested_edits` into the Edit Copilot shape. */
export function buildEditCopilotFromAnalysis(
  analysis: VideoAnalysisSchema,
): EditCopilot {
  const weakSegments = analysis.suggested_edits.map((edit) => {
    const start = parseTimestamp(edit.time);
    return {
      start,
      end: start + 5,
      title: edit.title,
      problem: edit.title,
      suggestions: edit.suggestions.map((action) => ({ action })),
      alternatives: edit.alternatives,
    };
  });

  return { weakSegments };
}
