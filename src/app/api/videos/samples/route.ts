import { NextResponse } from "next/server";

import { VIDEO_SAMPLES } from "@/lib/videos/samples";
import type { ApiResponse, VideoSample } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/videos/samples
 *
 * Returns the curated TikTok demo clips (UploadThing / ufs.sh URLs).
 * Arbitrary file upload is disabled in the UI; clients pick from this list.
 */
export async function GET(): Promise<NextResponse> {
  const body: ApiResponse<{ samples: VideoSample[] }> = {
    success: true,
    data: { samples: [...VIDEO_SAMPLES] },
  };
  return NextResponse.json(body);
}
