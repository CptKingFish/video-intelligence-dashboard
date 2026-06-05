"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Brain, Zap } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sampleActivation } from "@/lib/analysis/brain-scan";
import { formatTimestamp } from "@/lib/utils";
import type { BrainScan } from "@/lib/types";

/** three.js cannot render on the server — load the Canvas client-side only. */
const BrainScan3D = dynamic(
  () => import("@/components/video/brain-scan-3d").then((m) => m.BrainScan3D),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full" />,
  },
);

const SCENE_HEIGHT = 320;

export function BrainScanCard({
  scan,
  currentTime,
  duration,
  onSeek,
}: {
  scan: BrainScan;
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const activationNow = Math.round(
    sampleActivation(scan.activation, currentTime) * 100,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="size-4 text-primary" />
          Predicted brain response
        </CardTitle>
        <CardDescription>
          fMRI-style cortical activation (fsaverage5) predicted by TRIBE v2 —
          hotspots intensify with the stimulation timeline as the video plays.
        </CardDescription>
      </CardHeader>

      <div className="relative" style={{ height: SCENE_HEIGHT }}>
        <BrainScan3D
          activation={scan.activation}
          currentTime={currentTime}
          duration={duration}
        />

        {/* Live activation readout */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border bg-background/70 px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Activation
          </p>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {activationNow}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </p>
        </div>

        {/* Aggregate brain response score */}
        <div className="pointer-events-none absolute right-4 top-4 rounded-lg border bg-background/70 px-3 py-2 text-right backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Brain response
          </p>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {scan.brainResponseScore}
            <span className="text-sm font-normal text-muted-foreground">
              /100
            </span>
          </p>
        </div>

        {/* Turbo colorbar legend */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">low</span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #30123b, #4145ab, #28bceb, #a2fc3c, #fb8022, #d23105, #7a0403)",
            }}
          />
          <span className="text-[10px] text-muted-foreground">high</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSeek(scan.stimulatingMoment.t)}
        className="flex w-full items-start gap-2 border-t px-4 py-3 text-left transition-colors hover:bg-accent/40"
      >
        <Zap className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <span className="text-sm">
          <span className="font-medium">
            Peak at {formatTimestamp(scan.stimulatingMoment.t)} ·{" "}
          </span>
          <span className="text-muted-foreground">
            {scan.stimulatingMoment.event}
          </span>
        </span>
      </button>
    </Card>
  );
}
