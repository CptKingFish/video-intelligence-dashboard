/**
 * Curated TikTok-style demo videos hosted on UploadThing (ufs.sh).
 * Arbitrary uploads are disabled; users pick from this catalog.
 */

import type { VideoSample } from "@/lib/types";

export type { VideoSample };

export const VIDEO_SAMPLES: readonly VideoSample[] = [
  {
    id: "tiktok-01",
    title: "TikTok Hook A",
    description: "Fast opener · ~15s",
    videoUrl:
      "https://yjdzbero6a.ufs.sh/f/tquDckWYIgn0QYympbsBFefE1wr42A30P6oj95cbgNzCLTlp",
    durationSeconds: 15,
    tags: ["hook", "fast-cut"],
  },
  {
    id: "tiktok-02",
    title: "TikTok Story B",
    description: "Narrative beat · ~18s",
    videoUrl:
      "https://yjdzbero6a.ufs.sh/f/tquDckWYIgn04n8z2mPLuBq0SKUnC3iH7phDl6ZNetgXvzPc",
    durationSeconds: 18,
    tags: ["story", "talking-head"],
  },
  {
    id: "tiktok-03",
    title: "TikTok Motion C",
    description: "High motion · ~12s",
    videoUrl:
      "https://yjdzbero6a.ufs.sh/f/tquDckWYIgn00TSSDPzZy43YEJUlscNDvpMh2uizrV17WaRK",
    durationSeconds: 12,
    tags: ["motion", "b-roll"],
  },
  {
    id: "tiktok-04",
    title: "TikTok Reveal D",
    description: "Payoff moment · ~20s",
    videoUrl:
      "https://yjdzbero6a.ufs.sh/f/tquDckWYIgn0cQCXt64JrlLAnB9Ut187zvMuWwODdiKQ0gFI",
    durationSeconds: 20,
    tags: ["reveal", "before-after"],
  },
  {
    id: "tiktok-05",
    title: "TikTok Punch E",
    description: "Punchline edit · ~14s",
    videoUrl:
      "https://yjdzbero6a.ufs.sh/f/tquDckWYIgn0vPjmmcb6sxuANWPOgC8MqI9oYGDcrhF0ljSB",
    durationSeconds: 14,
    tags: ["comedy", "punchline"],
  },
] as const;

const sampleById = new Map(VIDEO_SAMPLES.map((s) => [s.id, s]));

export function getVideoSample(id: string): VideoSample | undefined {
  return sampleById.get(id);
}

export function isValidSampleId(id: string): boolean {
  return sampleById.has(id);
}
