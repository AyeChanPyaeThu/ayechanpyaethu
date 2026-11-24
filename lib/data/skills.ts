import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Skill } from "@/lib/types/skill";

/**
 * Returns published skills ordered by their configured display order.
 *
 * The is_published filter makes the public-facing intent explicit;
 * Supabase RLS remains the database-level security boundary.
 */
export async function getPublicSkills(): Promise<Skill[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("skills")
    .select(
      [
        "id",
        "name",
        "category",
        "description",
        "proficiency_label",
        "sort_order",
        "is_published",
        "created_at",
        "updated_at",
      ].join(", ")
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Unable to fetch public skills:", error);
    return [];
  }

  return (data as Skill[] | null) ?? [];
}
