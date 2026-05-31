"use client";

import * as React from "react";

import type { Project, VideoAnalysis } from "@/lib/types";
import { VideoPlayer } from "@/components/video/video-player";
import { StatCards } from "@/components/video/stat-cards";
import { StimulationChart } from "@/components/video/stimulation-chart";
import { SignalsChart } from "@/components/video/signals-chart";
import { EmbeddingFingerprint } from "@/components/video/embedding-fingerprint";
import { HighlightsList } from "@/components/video/highlights-list";

/**
 * Client orchestrator for a single video's analysis. Owns the shared
 * playback cursor so the player, charts, and highlight list stay in sync —
 * clicking a highlight or a point on the chart seeks the video.
 */
export function AnalysisView({
  project,
  analysis,
}: {
  project: Project;
  analysis: VideoAnalysis;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = React.useState(0);

  const seekTo = React.useCallback((t: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = t;
      void video.play().catch(() => undefined);
    }
    setCurrentTime(t);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <VideoPlayer
          videoRef={videoRef}
          project={project}
          highlights={analysis.highlights}
          duration={analysis.durationSeconds}
          onTimeUpdate={setCurrentTime}
          onSeek={seekTo}
        />
        <StimulationChart
          timeline={analysis.timeline}
          highlights={analysis.highlights}
          currentTime={currentTime}
          onSeek={seekTo}
        />
        <SignalsChart timeline={analysis.timeline} currentTime={currentTime} />
      </div>

      <div className="flex flex-col gap-6">
        <StatCards analysis={analysis} project={project} />
        <HighlightsList
          highlights={analysis.highlights}
          currentTime={currentTime}
          onSeek={seekTo}
        />
        <EmbeddingFingerprint
          embedding={analysis.embedding}
          dim={analysis.embeddingDim}
        />
      </div>
    </div>
  );
}
