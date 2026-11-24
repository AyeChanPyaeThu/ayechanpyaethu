import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { Interest, InterestRecord } from "@/lib/types/interest";

export async function getPublicInterests(): Promise<Interest[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("interests")
    .select("id, title, description, icon, sort_order, is_published, created_at, updated_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Unable to fetch public interests:", error);
    return [];
  }

  const records = (data ?? []) as unknown as InterestRecord[];

  return records.map((interest) => ({
    id: interest.id,
    name: interest.title,
    description: interest.description,
    img: "/pf9.jfif",
    icon: interest.icon,
  }));
}
