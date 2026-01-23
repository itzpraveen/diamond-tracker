import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BUILD_TIME = new Date().toISOString();
const VERSION =
  process.env.RENDER_GIT_COMMIT ||
  process.env.GIT_COMMIT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  "unknown";

export function GET() {
  return NextResponse.json({
    version: VERSION,
    buildTime: BUILD_TIME
  });
}
