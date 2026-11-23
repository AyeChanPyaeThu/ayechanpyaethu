import { connection, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Ensure this request-time check is not evaluated during prerendering.
    await connection();

    const supabase = await createClient();

    // A read-only query verifies the URL, key, Data API and table access.
    // RLS may return no rows when no public profile has been created yet.
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase health check failed:", error);
      return NextResponse.json(
        { connected: false, message: "Supabase connection check failed." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      connected: true,
      message: "Supabase is reachable and the profiles table is accessible.",
    });
  } catch (error) {
    console.error("Supabase health check error:", error);
    return NextResponse.json(
      { connected: false, message: "Unable to reach Supabase." },
      { status: 503 }
    );
  }
}
