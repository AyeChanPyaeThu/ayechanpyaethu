import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Json, Profile } from "@/lib/types/profile";

const PROFILE_COLUMNS =
  "id, display_name, headline, biography, location, public_email, avatar_url, resume_url, social_links, is_public, created_at, updated_at";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isOptionalText(
  value: unknown,
  maxLength: number
): value is string | null {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= maxLength)
  );
}

function isJsonObject(value: unknown): value is Record<string, Json> {
  return isPlainObject(value);
}

/** Retrieve the complete profile for the authenticated administrator. */
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("is_singleton", true)
    .maybeSingle();

  if (error) {
    console.error("Unable to retrieve profile:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    profile: (data as Profile | null) ?? null,
  });
}

/** Create or replace the single portfolio profile. */
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
    !isPlainObject(body) ||
    typeof body.display_name !== "string" ||
    body.display_name.trim().length === 0 ||
    body.display_name.length > 120 ||
    typeof body.headline !== "string" ||
    body.headline.length > 200 ||
    typeof body.biography !== "string" ||
    body.biography.length > 5000 ||
    !isOptionalText(body.location, 120) ||
    !isOptionalText(body.public_email, 254) ||
    !isOptionalText(body.avatar_url, 2048) ||
    !isOptionalText(body.resume_url, 2048) ||
    (body.social_links !== undefined && !isJsonObject(body.social_links)) ||
    typeof body.is_public !== "boolean"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Provide a display_name, headline, biography, valid optional profile fields, social_links object, and is_public boolean.",
      },
      { status: 400 }
    );
  }

  const profileValues = {
    is_singleton: true,
    display_name: body.display_name.trim(),
    headline: body.headline.trim(),
    biography: body.biography.trim(),
    location: body.location ?? null,
    public_email: body.public_email ?? null,
    avatar_url: body.avatar_url ?? null,
    resume_url: body.resume_url ?? null,
    social_links: body.social_links ?? {},
    is_public: body.is_public,
  };

  const { data, error } = await admin.supabase
    .from("profiles")
    .upsert(profileValues, { onConflict: "is_singleton" })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    console.error("Unable to save profile:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Profile saved successfully.",
    profile: data as Profile,
  });
}
