"use client";

import * as React from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ActionCtaButton } from "@/components/dashboard/action-cta-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AbTestResult, ApiResponse, VideoSample } from "@/lib/types";

export function AbTestDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [samples, setSamples] = React.useState<VideoSample[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<AbTestResult | null>(null);

  React.useEffect(() => {
    if (!open) return;
    void fetch("/api/videos/samples")
      .then((r) => r.json())
      .then((body: ApiResponse<{ samples: VideoSample[] }>) => {
        if (body.success && body.data) setSamples(body.data.samples);
      });
  }, [open]);

  function toggle(id: string) {
    setResult(null);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= 3) {
        toast.message("Pick up to 3 versions to compare.");
        return current;
      }
      return [...current, id];
    });
  }

  async function runTest() {
    if (selected.length < 2) {
      toast.error("Select at least 2 videos.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/videos/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleIds: selected }),
      });
      const body: ApiResponse<AbTestResult> = await response.json();
      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error ?? "A/B test failed.");
      }
      setResult(body.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A/B test failed.");
    } finally {
      setBusy(false);
    }
  }

  const maxScore = result
    ? Math.max(...result.candidates.map((c) => c.score), 1)
    : 100;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) {
          setSelected([]);
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <ActionCtaButton
            variant="abtest"
            icon={<FlaskConical className="size-4" />}
            label="Neural A/B test"
            hint="Compare 2–3 edits before you post"
          />
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Intelliral neural A/B test</DialogTitle>
          <DialogDescription>
            Compare 2–3 TikTok edits before you publish. Intelliral predicts
            which version wins.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {samples.map((sample) => {
            const active = selected.includes(sample.id);
            return (
              <button
                key={sample.id}
                type="button"
                disabled={busy}
                onClick={() => toggle(sample.id)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/40",
                )}
              >
                <p className="font-medium">{sample.title}</p>
                <p className="text-xs text-muted-foreground">
                  {sample.description}
                </p>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          disabled={selected.length < 2 || busy}
          onClick={() => void runTest()}
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              Running brain model…
            </>
          ) : (
            "Predict winner"
          )}
        </Button>

        {result && (
          <div className="flex flex-col gap-3 rounded-lg border bg-accent/20 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Winner</p>
              <p className="text-lg font-bold">{result.winnerTitle}</p>
              <p className="text-sm text-muted-foreground">
                Confidence: {result.confidencePercent}%
              </p>
              <p className="mt-1 text-sm">{result.reason}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {result.candidates.map((c) => (
                <li key={c.sampleId} className="text-sm">
                  <div className="mb-1 flex justify-between">
                    <span
                      className={
                        c.sampleId === result.winnerSampleId
                          ? "font-semibold text-primary"
                          : ""
                      }
                    >
                      {c.title}
                    </span>
                    <span className="tabular-nums font-medium">{c.score}</span>
                  </div>
                  <Progress value={(c.score / maxScore) * 100} className="h-2" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
