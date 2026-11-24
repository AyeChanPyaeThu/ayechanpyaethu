import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Achievement, AchievementRecord } from "@/lib/types/achievement";

/**
 * Fetch published achievements in their configured display order.
 * Supabase RLS remains the database-level security boundary.
 */
export async function getPublicAchievements(): Promise<Achievement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("achievements")
    .select(
      "id, title, issuer, description, achieved_on, credential_url, image_url, image_urls, status, sort_order, created_at, updated_at"
    )
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Unable to fetch public achievements:", error);
    return [];
  }

  const records = (data ?? []) as unknown as AchievementRecord[];

  return records.map((achievement) => ({
    id: achievement.id,
    name: achievement.title,
    note: achievement.issuer ?? "",
    description: achievement.description ?? "",
    img: achievement.image_url ?? achievement.image_urls?.[0] ?? "",
    images:
      achievement.image_urls?.length > 0
        ? achievement.image_urls
        : achievement.image_url
          ? [achievement.image_url]
          : [],
  }));
}
