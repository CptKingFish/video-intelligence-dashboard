/**
 * Curated demo videos hosted on UploadThing (ufs.sh).
 * Arbitrary uploads are disabled; users pick from this catalog.
 */

import type { VideoSample } from "@/lib/types";

export type { VideoSample };

const UFS_BASE = "https://yjdzbero6a.ufs.sh/f";

export function uploadthingUrl(key: string): string {
  return `${UFS_BASE}/${key}`;
}

/** Extract the UploadThing file key from a ufs.sh URL. */
export function extractUploadthingKey(url: string): string | null {
  const match = url.match(/\/f\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export const VIDEO_SAMPLES: readonly VideoSample[] = [
  {
    id: "corporate-day",
    title: "Stick Stories — Corporate Day",
    description: "Finance humour · ~57s",
    uploadthingKey: "tquDckWYIgn0R0nAoDOuI2a4UMfKQzvC6BLP7EbYrWiqckw1",
    videoUrl: uploadthingUrl(
      "tquDckWYIgn0R0nAoDOuI2a4UMfKQzvC6BLP7EbYrWiqckw1",
    ),
    durationSeconds: 57,
    tags: ["corporate", "humour", "linkedin"],
  },
  {
    id: "memorial-fail",
    title: "Memorial Ceremony Fail",
    description: "Dark humour payoff · ~13s",
    uploadthingKey: "tquDckWYIgn0EPLCri5cSvZtb8XnjhcQxLr0kledzs7f9o2J",
    videoUrl: uploadthingUrl(
      "tquDckWYIgn0EPLCri5cSvZtb8XnjhcQxLr0kledzs7f9o2J",
    ),
    durationSeconds: 13,
    tags: ["fail", "viral", "dark-humour"],
  },
  {
    id: "rec-room",
    title: "Rec Room Combat Peak",
    description: "VR gaming chaos · ~16s",
    uploadthingKey: "tquDckWYIgn042q4JUPLuBq0SKUnC3iH7phDl6ZNetgXvzPc",
    videoUrl: uploadthingUrl(
      "tquDckWYIgn042q4JUPLuBq0SKUnC3iH7phDl6ZNetgXvzPc",
    ),
    durationSeconds: 16,
    tags: ["gaming", "vr", "rec-room"],
  },
] as const;

const sampleById = new Map(VIDEO_SAMPLES.map((s) => [s.id, s]));
const sampleByKey = new Map(
  VIDEO_SAMPLES.map((s) => [s.uploadthingKey, s]),
);

export function getVideoSample(id: string): VideoSample | undefined {
  return sampleById.get(id);
}

export function getVideoSampleByKey(
  uploadthingKey: string,
): VideoSample | undefined {
  return sampleByKey.get(uploadthingKey);
}

export function isValidSampleId(id: string): boolean {
  return sampleById.has(id);
}
