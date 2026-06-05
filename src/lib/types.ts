/** Shared domain types for Intelliral. */

export type ProcessingStatus = "queued" | "processing" | "ready" | "failed";

/** A single point on the per-second analysis timeline. */
export interface TimelinePoint {
  /** Offset from the start of the video, in seconds. */
  t: number;
  /** Normalized "stimulation" / salience score in [0, 1]. */
  score: number;
  /** Audio energy / loudness proxy in [0, 1]. */
  energy: number;
  /** Visual motion proxy in [0, 1]. */
  motion: number;
}

/** A detected highlight ("stimulating part") within the video. */
export interface Highlight {
  id: string;
  /** Start offset in seconds. */
  start: number;
  /** End offset in seconds. */
  end: number;
  /** Peak score across the segment, [0, 1]. */
  peak: number;
  label: string;
}

/** TRIBE v2 analysis schema persisted as JSONB on each project row. */
export interface VideoAnalysisSchema {
  stimulation_timeline: { score: number; timestamp: string }[];
  brain_response_score: number;
  predicted_drop_off: string[];
  audience_segment: string;
  mean_stimulation: number;
  peak_stimulation: number;
  highlights: number;
  stimulating_moment: { event: string; timestamp: string };
  suggested_edits: {
    title: string;
    time: string;
    suggestions: string[];
    alternatives: string;
  }[];
}

/** One row from the stim_projections time-series table. */
export interface StimProjectionPoint {
  timestep: number;
  timeSec: number;
  stimProjection: number;
  cosineToStim: number;
}

/** A project owns one uploaded video and its derived analysis. */
export interface Project {
  id: string;
  uploadthingKey: string;
  ownerId: string;
  title: string;
  /** Data-URL or remote URL of the captured first frame. */
  thumbnailUrl: string;
  /** Playable video URL (blob/object URL or remote). */
  videoUrl: string | null;
  status: ProcessingStatus;
  durationSeconds: number;
  createdAt: string;
  /** TRIBE brain response score (0–100), when analysis is available. */
  brainResponseScore?: number;
}

/**
 * One point on the predicted-brain-response activation series. Mirrors the
 * TRIBE v2 `stim_projection` output (one prediction per ~second of stimulus).
 */
export interface BrainActivationPoint {
  /** Offset from the start of the video, in seconds. */
  t: number;
  /** Normalized cortical activation in [0, 1] (drives the heatmap intensity). */
  activation: number;
  /** Raw stimulation projection magnitude as returned by the model. */
  projection: number;
}

/** The single most stimulating moment, surfaced from the analysis schema. */
export interface StimulatingMoment {
  event: string;
  /** Offset in seconds. */
  t: number;
}

/**
 * Predicted brain-response payload that drives the 3D cortical visualization.
 * Maps the TRIBE-style per-second activation onto a brain surface.
 */
export interface BrainScan {
  activation: BrainActivationPoint[];
  /** Mean stimulation across the clip, 0–100. */
  meanStimulation: number;
  /** Peak stimulation across the clip, 0–100. */
  peakStimulation: number;
  /** Aggregate brain response score, 0–100. */
  brainResponseScore: number;
  stimulatingMoment: StimulatingMoment;
  /** Timestamps (seconds) where viewers are predicted to drop off. */
  predictedDropOff: number[];
  audienceSegment: string;
}

/** Full analysis payload returned by the processing endpoint. */
export interface VideoAnalysis {
  projectId: string;
  durationSeconds: number;
  timeline: TimelinePoint[];
  highlights: Highlight[];
  /** Aggregate stats for the summary cards. */
  stats: {
    averageScore: number;
    peakScore: number;
    highlightCount: number;
    engagementIndex: number;
  };
  insights: VideoInsights;
  /** Predicted brain response for the 3D cortical scan, when available. */
  brainScan?: BrainScan;
  /** Mock-only embedding vector when analysis is generated locally. */
  embedding?: number[];
  embeddingDim?: number;
}

/** Curated demo clip from GET /api/videos/samples. */
export interface VideoSample {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  uploadthingKey: string;
  durationSeconds: number;
  tags: string[];
  /** Captured frame or hosted poster; omitted samples use live video frame. */
  thumbnailUrl?: string;
}

export type PlatformId = "tiktok" | "instagram_reels" | "youtube_shorts";

export interface PlatformRating {
  platform: PlatformId;
  label: string;
  stars: number;
  score: number;
}

export interface DropOffBucket {
  range: string;
  dropOffPercent: number;
}

export interface AudienceSegment {
  label: string;
  response: "low" | "medium" | "high" | "very_high";
}

export interface ViralSimulator {
  brainResponseScore: number;
  platforms: PlatformRating[];
  dropOff: DropOffBucket[];
  audiences: AudienceSegment[];
  signals: {
    engagementScore: number;
    motionScore: number;
    sceneChangeScore: number;
    hookScore: number;
  };
}

export interface EditSuggestion {
  action: string;
}

export interface EditCopilotSegment {
  start: number;
  end: number;
  problem: string;
  /** Short headline for the weak segment (e.g. "Weak Hook Energy"). */
  title?: string;
  suggestions: EditSuggestion[];
  alternativeHook?: string;
  /** Free-form alternative approach for the segment. */
  alternatives?: string;
  suggestedBroll?: string[];
}

export interface EditCopilot {
  weakSegments: EditCopilotSegment[];
}

export interface AbTestCandidate {
  sampleId: string;
  title: string;
  score: number;
}

export interface AbTestResult {
  winnerSampleId: string;
  winnerTitle: string;
  confidencePercent: number;
  reason: string;
  candidates: AbTestCandidate[];
}

/** Prediction + copilot outputs derived from TRIBE-style timeline heuristics. */
export interface VideoInsights {
  viralSimulator: ViralSimulator;
  editCopilot: EditCopilot;
}

/** Consistent API envelope (see global patterns). */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
