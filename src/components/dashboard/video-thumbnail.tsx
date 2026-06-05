"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { isPlaceholderThumbnail } from "@/lib/video/capture-frame";

interface VideoThumbnailProps {
  thumbnailUrl: string;
  videoUrl?: string | null;
  alt: string;
  className?: string;
}

/**
 * Renders a real video frame when possible. Falls back to a paused `<video>`
 * element when the stored thumbnail is a gradient placeholder or video URL.
 */
export function VideoThumbnail({
  thumbnailUrl,
  videoUrl,
  alt,
  className,
}: VideoThumbnailProps) {
  const useVideoFrame =
    Boolean(videoUrl) &&
    (!thumbnailUrl || isPlaceholderThumbnail(thumbnailUrl));
  const [loaded, setLoaded] = React.useState(!useVideoFrame);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!useVideoFrame) return;
    const video = videoRef.current;
    if (!video) return;

    const seekToFrame = () => {
      const target = Number.isFinite(video.duration)
        ? Math.min(0.15, video.duration / 2)
        : 0.15;
      video.currentTime = target;
    };

    const onSeeked = () => setLoaded(true);

    video.addEventListener("loadedmetadata", seekToFrame);
    video.addEventListener("seeked", onSeeked);
    return () => {
      video.removeEventListener("loadedmetadata", seekToFrame);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [useVideoFrame, videoUrl]);

  if (useVideoFrame && videoUrl) {
    return (
      <div className={cn("relative size-full bg-zinc-900", className)}>
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-zinc-800" />
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          preload="metadata"
          aria-label={alt}
          className={cn(
            "size-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative size-full bg-zinc-900", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
