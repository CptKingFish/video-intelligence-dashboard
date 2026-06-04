"use client";

import * as React from "react";

/** Returns a value that updates at most once per `intervalMs`. */
export function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = React.useState(value);
  const lastCommit = React.useRef(0);

  React.useEffect(() => {
    const now = performance.now();
    const elapsed = now - lastCommit.current;

    if (elapsed >= intervalMs) {
      lastCommit.current = now;
      setThrottled(value);
      return;
    }

    const timer = window.setTimeout(() => {
      lastCommit.current = performance.now();
      setThrottled(value);
    }, intervalMs - elapsed);

    return () => window.clearTimeout(timer);
  }, [value, intervalMs]);

  return throttled;
}
