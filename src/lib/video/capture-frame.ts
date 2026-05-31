/**
 * Client-side first-frame capture.
 *
 * Loads the selected video, seeks just past the start, and paints the frame
 * onto a canvas to produce a JPEG data URL used as the project thumbnail.
 * Also returns the video duration and a blob: object URL for in-session
 * playback. Browser-only — never import from the server.
 */

export interface CapturedFrame {
  thumbnailUrl: string;
  durationSeconds: number;
  /** blob: URL valid for the lifetime of the current document. */
  videoUrl: string;
}

const FALLBACK_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#1e1b4b"/></svg>',
  );

export function captureFirstFrame(file: File): Promise<CapturedFrame> {
  return new Promise((resolve) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    let settled = false;
    const finish = (thumbnailUrl: string, durationSeconds: number) => {
      if (settled) return;
      settled = true;
      resolve({ thumbnailUrl, durationSeconds, videoUrl });
    };

    const draw = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(FALLBACK_THUMB, video.duration || 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.72), video.duration || 0);
      } catch {
        finish(FALLBACK_THUMB, video.duration || 0);
      }
    };

    video.addEventListener("loadedmetadata", () => {
      // Seek a touch past 0 to avoid an all-black opening frame.
      const target = Number.isFinite(video.duration)
        ? Math.min(0.1, video.duration / 2)
        : 0.1;
      video.currentTime = target;
    });
    video.addEventListener("seeked", draw, { once: true });
    video.addEventListener("error", () =>
      finish(FALLBACK_THUMB, video.duration || 0),
    );

    // Safety net if the browser never fires `seeked`.
    setTimeout(() => finish(FALLBACK_THUMB, video.duration || 0), 6000);

    video.src = videoUrl;
  });
}
