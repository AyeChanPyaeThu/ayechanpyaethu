import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicSiteSettings,
  SiteSettingRecord,
} from "@/lib/types/site-settings";

/**
 * Fetch only settings explicitly marked as public.
 * Supabase RLS also enforces this restriction at the database level.
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, is_public, updated_at")
    .eq("is_public", true);

  if (error) {
    console.error("Unable to fetch public site settings:", error);
    return {};
  }

  const settings = (data ?? []) as unknown as SiteSettingRecord[];

  return settings.reduce<PublicSiteSettings>((result, setting) => {
    result[setting.key] = setting.value;
    return result;
  }, {});
}
