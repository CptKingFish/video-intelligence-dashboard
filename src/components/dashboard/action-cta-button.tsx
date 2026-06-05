"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ActionCtaVariant = "simulate" | "abtest";

export interface ActionCtaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ActionCtaVariant;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}

/**
 * Premium dashboard CTAs — gradient simulate + glass neural A/B styles.
 * Single `<button>` root so Radix `asChild` triggers work correctly.
 */
export const ActionCtaButton = React.forwardRef<
  HTMLButtonElement,
  ActionCtaButtonProps
>(function ActionCtaButton(
  { variant, icon, label, hint, className, disabled, ...props },
  ref,
) {
  const isSimulate = variant === "simulate";

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "group relative isolate overflow-hidden rounded-xl text-left",
        "transition-all duration-300",
        "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        isSimulate
          ? [
              "border border-white/20 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-[#fe2c55]",
              "px-4 py-2.5 text-white shadow-[0_4px_28px_-6px_rgba(236,72,153,0.65)]",
              "hover:shadow-[0_10px_36px_-6px_rgba(236,72,153,0.8)]",
              "focus-visible:ring-fuchsia-400",
            ]
          : [
              "border-2 border-transparent bg-clip-padding px-4 py-2.5",
              "bg-[linear-gradient(var(--background),var(--background))_padding-box,linear-gradient(to_right,#22d3ee,#8b5cf6,#d946ef)_border-box]",
              "shadow-[0_4px_28px_-6px_rgba(124,58,237,0.45)]",
              "hover:shadow-[0_10px_36px_-6px_rgba(124,58,237,0.6)]",
              "focus-visible:ring-violet-400",
            ],
        className,
      )}
      {...props}
    >
      {isSimulate && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}
      {!isSimulate && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/10 to-fuchsia-500/5 opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
      <span className="relative flex items-center gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            isSimulate
              ? "bg-white/20 shadow-inner backdrop-blur-sm ring-1 ring-white/30 text-white"
              : "bg-gradient-to-br from-violet-500/15 to-cyan-400/15 text-primary ring-1 ring-primary/20",
          )}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "text-sm font-bold leading-tight",
              isSimulate ? "text-white" : "text-foreground",
            )}
          >
            {label}
          </span>
          {hint && (
            <span
              className={cn(
                "text-[11px] font-medium",
                isSimulate ? "text-white/80" : "text-muted-foreground",
              )}
            >
              {hint}
            </span>
          )}
        </span>
      </span>
    </button>
  );
});
