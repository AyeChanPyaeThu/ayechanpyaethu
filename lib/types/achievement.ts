/**
 * Achievement records and the view model used by the existing certificate cards.
 */

export interface AchievementRecord {
  id: string;
  title: string;
  issuer: string | null;
  description: string | null;
  achieved_on: string | null;
  credential_url: string | null;
  image_url: string | null;
  image_urls: string[];
  status: "draft" | "published" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  note: string;
  description: string;
  img: string;
  images: string[];
}
