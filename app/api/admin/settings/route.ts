import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  SITE_SETTING_KEYS,
  type SiteSettingKey,
  type SiteSettingRecord,
} from "@/lib/types/site-settings";

function isSiteSettingKey(value: unknown): value is SiteSettingKey {
  return (
    typeof value === "string" &&
    SITE_SETTING_KEYS.includes(value as SiteSettingKey)
  );
}

/** Retrieve all settings for the authenticated administrator. */
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("site_settings")
    .select("key, value, is_public, updated_at")
    .order("key", { ascending: true });

  if (error) {
    console.error("Unable to retrieve site settings:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve site settings." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    settings: (data ?? []) as unknown as SiteSettingRecord[],
  });
}

/** Create or update one approved site settings group. */
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("key" in body) ||
    !("value" in body) ||
    !("is_public" in body) ||
    !isSiteSettingKey(body.key) ||
    typeof body.value !== "object" ||
    body.value === null ||
    Array.isArray(body.value) ||
    typeof body.is_public !== "boolean"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "A valid setting key, JSON object value, and is_public boolean are required.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("site_settings")
    .upsert(
      {
        key: body.key,
        value: body.value,
        is_public: body.is_public,
      },
      { onConflict: "key" }
    )
    .select("key, value, is_public, updated_at")
    .single();

  if (error) {
    console.error("Unable to save site settings:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save site settings." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    setting: data as unknown as SiteSettingRecord,
  });
}
