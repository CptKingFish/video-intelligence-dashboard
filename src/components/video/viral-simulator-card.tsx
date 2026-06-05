"use client";

import { Brain, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTimestamp } from "@/lib/utils";
import type { BrainScan, ViralSimulator } from "@/lib/types";

const RESPONSE_LABEL = {
  low: "Low response",
  medium: "Medium response",
  high: "High response",
  very_high: "Very high response",
} as const;

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400" aria-label={`${stars} out of 5 stars`}>
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </span>
  );
}

export function ViralSimulatorCard({
  simulator,
  brainScan,
  onSeek,
}: {
  simulator: ViralSimulator;
  brainScan?: BrainScan;
  onSeek?: (t: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Viral Simulator
        </CardTitle>
        <CardDescription>
          What happens if you post this? Platform & audience predictions.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
          <Brain className="size-8 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Brain Response Score</p>
            <p className="text-2xl font-bold tabular-nums">
              {brainScan?.brainResponseScore ?? simulator.brainResponseScore}
              <span className="text-base font-normal text-muted-foreground">
                /100
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {simulator.platforms.map((p) => (
            <div
              key={p.platform}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-medium">{p.label}</span>
              <StarRow stars={p.stars} />
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Predicted drop-off
          </p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {simulator.dropOff.map((bucket) => (
              <li
                key={bucket.range}
                className="flex justify-between rounded-md border px-2.5 py-1.5"
              >
                <span>{bucket.range}</span>
                <span className="font-semibold tabular-nums text-rose-400">
                  {bucket.dropOffPercent}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {brainScan && brainScan.predictedDropOff.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Predicted drop-off moments
            </p>
            <div className="flex flex-wrap gap-2">
              {brainScan.predictedDropOff.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSeek?.(t)}
                  className="rounded-md border px-2.5 py-1 font-mono text-xs text-rose-400 transition-colors hover:bg-accent/40"
                >
                  {formatTimestamp(t)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Audience segments
          </p>
          <ul className="flex flex-col gap-2">
            {simulator.audiences.map((a) => (
              <li
                key={a.label}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>{a.label}</span>
                <Badge variant="secondary">{RESPONSE_LABEL[a.response]}</Badge>
              </li>
            ))}
          </ul>
          {brainScan?.audienceSegment && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border bg-primary/5 p-3">
              <Users className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Best-fit audience:{" "}
                </span>
                {brainScan.audienceSegment}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
