import { Activity, Flame, Gauge, Layers } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import type { Project, VideoAnalysis } from "@/lib/types";

const pct = (value: number): string => `${Math.round(value * 100)}%`;

export function StatCards({
  analysis,
  project,
}: {
  analysis: VideoAnalysis;
  project: Project;
}) {
  const brain = analysis.insights.viralSimulator.brainResponseScore;

  const items = [
    {
      icon: Gauge,
      label: "Brain response",
      value: `${brain}/100`,
      tint: "text-primary",
    },
    {
      icon: Activity,
      label: "Avg. stimulation",
      value: pct(analysis.stats.averageScore),
      tint: "text-sky-400",
    },
    {
      icon: Flame,
      label: "Peak stimulation",
      value: pct(analysis.stats.peakScore),
      tint: "text-amber-400",
    },
    {
      icon: Layers,
      label: "Highlights",
      value: String(analysis.stats.highlightCount),
      tint: "text-emerald-400",
    },
  ] as const;

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, value, tint }) => (
          <div key={label} className="rounded-lg border bg-background/40 p-3">
            <Icon className={`mb-2 size-4 ${tint}`} />
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Meta label="Embedding" value={`${analysis.embeddingDim} dims`} />
        <Meta label="File size" value={formatBytes(project.fileSizeBytes)} />
      </dl>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t pt-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
