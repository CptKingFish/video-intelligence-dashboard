"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartFrame } from "@/components/video/chart-frame";
import { formatTimestamp } from "@/lib/utils";
import type { Highlight, TimelinePoint } from "@/lib/types";

interface StimulationChartProps {
  timeline: TimelinePoint[];
  highlights: Highlight[];
  currentTime: number;
  onSeek: (t: number) => void;
}

/** Matches previous `h-64` (16rem @ 16px). */
const STIMULATION_CHART_HEIGHT = 256;

export function StimulationChart({
  timeline,
  highlights,
  currentTime,
  onSeek,
}: StimulationChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stimulation timeline</CardTitle>
        <CardDescription>
          Per-second salience score. Shaded bands are detected highlights —
          click anywhere to seek.
        </CardDescription>
      </CardHeader>
      <ChartFrame height={STIMULATION_CHART_HEIGHT}>
        <AreaChart
          data={timeline}
          margin={{ top: 8, right: 16, bottom: 4, left: -16 }}
          onClick={(state) => {
            const t = Number(state?.activeLabel);
            if (Number.isFinite(t)) onSeek(t);
          }}
        >
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.7} />
              <stop
                offset="100%"
                stopColor="var(--chart-1)"
                stopOpacity={0.04}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="t"
            type="number"
            domain={[0, "dataMax"]}
            tickFormatter={(t) => formatTimestamp(Number(t))}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)}`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(t) => `At ${formatTimestamp(Number(t))}`}
            formatter={(value) => [
              `${Math.round(Number(value) * 100)}%`,
              "Score",
            ]}
          />
          {highlights.map((h) => (
            <ReferenceArea
              key={h.id}
              x1={h.start}
              x2={h.end}
              fill="var(--chart-4)"
              fillOpacity={0.12}
              stroke="var(--chart-4)"
              strokeOpacity={0.25}
            />
          ))}
          <ReferenceLine
            x={currentTime}
            stroke="var(--primary)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#scoreFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartFrame>
    </Card>
  );
}
