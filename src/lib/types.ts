/** Shared domain types for the Video Intelligence Dashboard. */

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

/** A project owns one uploaded video and its derived analysis. */
export interface Project {
  id: string;
  ownerId: string;
  title: string;
  /** Data-URL or remote URL of the captured first frame. */
  thumbnailUrl: string;
  /** Playable video URL (blob/object URL or remote). */
  videoUrl: string | null;
  status: ProcessingStatus;
  durationSeconds: number;
  fileSizeBytes: number;
  /** Dimensionality of the returned embedding vector. */
  embeddingDim: number;
  /** Curated catalog id when not a custom upload. */
  sampleId?: string | null;
  createdAt: string;
}

/** Full analysis payload returned by the processing endpoint. */
export interface VideoAnalysis {
  projectId: string;
  /** The raw vector embedding array returned by the backend. */
  embedding: number[];
  embeddingDim: number;
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
}

/** Curated demo clip from GET /api/videos/samples. */
export interface VideoSample {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  durationSeconds: number;
  tags: string[];
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
  suggestions: EditSuggestion[];
  alternativeHook?: string;
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
