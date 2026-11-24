/**
 * Project records and their public-facing view model.
 * Keep the database fields aligned with supabase/migrations/0001_initial_schema.sql.
 */

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  role: string | null;
  technologies: string[];
  github_url: string | null;
  live_demo_url: string | null;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectImageRecord {
  id: string;
  project_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}

/**
 * Normalized shape used by the existing project cards and DetailsModal.
 */
export interface Project {
  id: string;
  name: string;
  note: string;
  description: string;
  img: string;
  images: string[];
  githubUrl?: string;
  liveUrl?: string;
  technologies: string[];
  role: string | null;
}
