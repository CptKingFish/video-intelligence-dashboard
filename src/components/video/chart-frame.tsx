"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type ChartFrameProps = {
  /** Plot height in px — must match the wrapper so Recharts can size without % height. */
  height: number;
  className?: string;
  children: React.ReactElement;
};

/**
 * Wrapper for Recharts plots. Uses a fixed pixel height so ResponsiveContainer
 * never starts at -1×-1 (the Recharts 3 default when parent % height is unset).
 */
export function ChartFrame({ height, className, children }: ChartFrameProps) {
  const mounted = useMounted();

  return (
    <div
      className={cn("w-full min-w-0 px-2 pb-4", className)}
      style={{ height }}
    >
      {mounted ? (
        <ResponsiveContainer width="100%" height={height} debounce={50}>
          {children}
        </ResponsiveContainer>
      ) : (
        <Skeleton className="size-full" />
      )}
    </div>
  );
}
