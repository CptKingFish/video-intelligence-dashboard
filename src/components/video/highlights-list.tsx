"use client";

import { Play } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatTimestamp } from "@/lib/utils";
import type { Highlight } from "@/lib/types";

export function HighlightsList({
  highlights,
  currentTime,
  onSeek,
}: {
  highlights: Highlight[];
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stimulating moments</CardTitle>
        <CardDescription>Ranked by peak intensity. Tap to jump.</CardDescription>
      </CardHeader>
      <div className="max-h-72 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <ul className="flex flex-col gap-1.5">
          {highlights.map((h) => {
            const active = currentTime >= h.start && currentTime <= h.end;
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => onSeek(h.start)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-accent",
                    active ? "border-primary/50 bg-primary/10" : "border-transparent",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                    <Play className="size-3.5 fill-current" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {h.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatTimestamp(h.start)} – {formatTimestamp(h.end)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                    {Math.round(h.peak * 100)}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
