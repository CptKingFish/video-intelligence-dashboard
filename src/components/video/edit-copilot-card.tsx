"use client";

import { Check, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTimestamp } from "@/lib/utils";
import type { EditCopilot } from "@/lib/types";

export function EditCopilotCard({
  copilot,
  onSeek,
}: {
  copilot: EditCopilot;
  onSeek: (t: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="size-4 text-primary" />
          AI Edit Copilot
        </CardTitle>
        <CardDescription>
          Weak moments from the brain model — tap Fix to jump and review edits.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-4 px-4 pb-4">
        {copilot.weakSegments.map((segment) => (
          <article
            key={`${segment.start}-${segment.end}`}
            className="rounded-lg border bg-background/40 p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatTimestamp(segment.start)} – {formatTimestamp(segment.end)}
                </p>
                <p className="text-sm font-medium text-rose-400">
                  {segment.problem}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onSeek(segment.start)}
              >
                Fix
              </Button>
            </div>
            <ul className="mb-3 flex flex-col gap-1 text-sm">
              {segment.suggestions.map((s) => (
                <li key={s.action} className="flex items-center gap-2">
                  <Check className="size-3.5 shrink-0 text-emerald-500" />
                  {s.action}
                </li>
              ))}
            </ul>
            {segment.alternativeHook && (
              <p className="text-xs">
                <span className="text-muted-foreground">Alternative hook: </span>
                <span className="italic">&ldquo;{segment.alternativeHook}&rdquo;</span>
              </p>
            )}
            {segment.suggestedBroll && segment.suggestedBroll.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Suggested B-roll: {segment.suggestedBroll.join(" · ")}
              </p>
            )}
          </article>
        ))}
      </div>
    </Card>
  );
}
