import type { Json } from "@/lib/types/profile";

export const SITE_SETTING_KEYS = [
  "site_metadata",
  "contact_info",
  "social_links",
  "footer",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export interface SiteSettingRecord {
  key: SiteSettingKey;
  value: Json;
  is_public: boolean;
  updated_at: string;
}

export type PublicSiteSettings = Partial<
  Record<SiteSettingKey, Json>
>;
