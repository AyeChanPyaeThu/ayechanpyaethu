import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";

/**
 * Returns the published profile for public-facing pages.
 *
 * The is_public filter makes the intent explicit; Supabase RLS remains
 * the database-level security boundary.
 */
export async function getPublicProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "display_name",
        "headline",
        "biography",
        "location",
        "public_email",
        "avatar_url",
        "resume_url",
        "social_links",
        "is_public",
        "created_at",
        "updated_at",
      ].join(", ")
    )
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    console.error("Unable to fetch public profile:", error);
    return null;
  }

  return (data as Profile | null) ?? null;
}
