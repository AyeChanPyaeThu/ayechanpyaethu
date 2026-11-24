
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrlOrPath(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) return true;

  // Allow local paths, but reject protocol-relative URLs and path traversal.
  if (trimmed.startsWith("/")) {
    return (
      !trimmed.startsWith("//") &&
      !trimmed.includes("\\") &&
      !trimmed.split("/").includes("..")
    );
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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
    body.display_name.trim().length > 120 ||
    typeof body.headline !== "string" ||
    body.headline.trim().length > 200 ||
    typeof body.biography !== "string" ||
    body.biography.trim().length > 5000 ||
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
        error: "Please provide valid profile information and optional fields.",
      },
      { status: 400 }
    );
  }

  const publicEmail =
    typeof body.public_email === "string"
      ? body.public_email.trim()
      : null;

  const avatarUrl =
    typeof body.avatar_url === "string"
      ? body.avatar_url.trim()
      : null;

  const resumeUrl =
    typeof body.resume_url === "string"
      ? body.resume_url.trim()
      : null;

  if (publicEmail && !isValidEmail(publicEmail)) {
    return NextResponse.json(
      { success: false, error: "Please provide a valid public email address." },
      { status: 400 }
    );
  }

  if (
    (avatarUrl && !isValidUrlOrPath(avatarUrl)) ||
    (resumeUrl && !isValidUrlOrPath(resumeUrl))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Avatar and resume URLs must be valid HTTP(S) URLs or local paths.",
      },
      { status: 400 }
    );
  }

  const profileValues = {
    is_singleton: true,
    display_name: body.display_name.trim(),
    headline: body.headline.trim(),
    biography: body.biography.trim(),
    location:
      typeof body.location === "string"
        ? body.location.trim() || null
        : null,
    public_email: publicEmail || null,
    avatar_url: avatarUrl || null,
    resume_url: resumeUrl || null,
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
