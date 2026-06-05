"use client";

import * as React from "react";

import { useThrottledValue } from "@/hooks/use-throttled-value";
import type { Project, VideoAnalysis } from "@/lib/types";
import { VideoPlayer } from "@/components/video/video-player";
import { StatCards } from "@/components/video/stat-cards";
import { BrainScanCard } from "@/components/video/brain-scan-card";
import { StimulationChart } from "@/components/video/stimulation-chart";
import { SignalsChart } from "@/components/video/signals-chart";
import { EmbeddingFingerprint } from "@/components/video/embedding-fingerprint";
import { HighlightsList } from "@/components/video/highlights-list";
import { ViralSimulatorCard } from "@/components/video/viral-simulator-card";
import { EditCopilotCard } from "@/components/video/edit-copilot-card";

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
  /** Charts only need ~4 updates/sec; avoids re-rendering heavy Recharts trees every frame. */
  const chartTime = useThrottledValue(currentTime, 250);
  const lastTimeUpdate = React.useRef(0);

  const onTimeUpdate = React.useCallback((t: number) => {
    const now = performance.now();
    if (now - lastTimeUpdate.current < 100) return;
    lastTimeUpdate.current = now;
    setCurrentTime(t);
  }, []);

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
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <VideoPlayer
          videoRef={videoRef}
          project={project}
          highlights={analysis.highlights}
          duration={analysis.durationSeconds}
          onTimeUpdate={onTimeUpdate}
          onSeek={seekTo}
        />
        {analysis.brainScan && (
          <BrainScanCard
            scan={analysis.brainScan}
            currentTime={chartTime}
            duration={analysis.durationSeconds}
            onSeek={seekTo}
          />
        )}
        <StimulationChart
          timeline={analysis.timeline}
          highlights={analysis.highlights}
          currentTime={chartTime}
          onSeek={seekTo}
        />
        <SignalsChart timeline={analysis.timeline} currentTime={chartTime} />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <ViralSimulatorCard
          simulator={analysis.insights.viralSimulator}
          brainScan={analysis.brainScan}
          onSeek={seekTo}
        />
        <EditCopilotCard
          copilot={analysis.insights.editCopilot}
          onSeek={seekTo}
        />
        <StatCards analysis={analysis} project={project} />
        <HighlightsList
          highlights={analysis.highlights}
          currentTime={currentTime}
          onSeek={seekTo}
        />
        {analysis.embedding && analysis.embeddingDim ? (
          <EmbeddingFingerprint
            embedding={analysis.embedding}
            dim={analysis.embeddingDim}
          />
        ) : null}
      </div>
    </div>
  );
}
