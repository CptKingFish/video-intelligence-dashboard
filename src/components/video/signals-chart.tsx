"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import type { TimelinePoint } from "@/lib/types";

/** Matches previous `h-56` (14rem @ 16px). */
const SIGNALS_CHART_HEIGHT = 224;

export function SignalsChart({
  timeline,
  currentTime,
}: {
  timeline: TimelinePoint[];
  currentTime: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Audio energy vs. visual motion
        </CardTitle>
        <CardDescription>
          The two underlying signals that drive the stimulation score.
        </CardDescription>
      </CardHeader>
      <ChartFrame height={SIGNALS_CHART_HEIGHT}>
        <LineChart
          data={timeline}
          margin={{ top: 8, right: 16, bottom: 4, left: -16 }}
        >
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
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(t) => `At ${formatTimestamp(Number(t))}`}
            formatter={(value, name) => [
              `${Math.round(Number(value) * 100)}%`,
              name === "energy" ? "Energy" : "Motion",
            ]}
          />
          <ReferenceLine
            x={currentTime}
            stroke="var(--primary)"
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="motion"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartFrame>
    </Card>
  );
}
