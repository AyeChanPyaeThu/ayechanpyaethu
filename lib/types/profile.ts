/**
 * Public profile data stored in the Supabase profiles table.
 * Keep this aligned with supabase/migrations/0001_initial_schema.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  display_name: string;
  headline: string;
  biography: string;
  location: string | null;
  public_email: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  social_links: Json;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
