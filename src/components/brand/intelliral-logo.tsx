import { BrainCircuit } from "lucide-react";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function IntelliralLogo({
  className,
  showWordmark = true,
  size = "default",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "default" | "sm" | "lg";
}) {
  const iconSize =
    size === "sm" ? "size-7 rounded-lg" : size === "lg" ? "size-11 rounded-xl" : "size-8 rounded-lg";
  const iconInner =
    size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";
  const textSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid place-items-center bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-md shadow-fuchsia-500/30",
          iconSize,
        )}
      >
        <BrainCircuit className={iconInner} />
      </span>
      {showWordmark && (
        <span className={cn("font-bold tracking-tight", textSize)}>
          <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
            {BRAND.name}
          </span>
        </span>
      )}
    </span>
  );
}
