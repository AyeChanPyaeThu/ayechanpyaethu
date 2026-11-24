/**
 * Skill records stored in the Supabase skills table.
 * Keep this aligned with supabase/migrations/0001_initial_schema.sql.
 */

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  proficiency_label: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
