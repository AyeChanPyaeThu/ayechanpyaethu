import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Returns a Supabase client only when the current request belongs to an admin.
 * Database RLS remains the final authorization boundary.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (
  claimsError ||
  typeof userId !== "string" ||
  claimsData?.claims?.aal !== "aal2"
) {
  return null;
}

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError || roleRecord?.role !== "admin") {
    return null;
  }

  return { supabase, userId };
}
