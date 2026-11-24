import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/data/site-settings";

/** Return only settings marked public. */
export async function GET() {
  const settings = await getPublicSiteSettings();

  return NextResponse.json({
    success: true,
    settings,
  });
}
