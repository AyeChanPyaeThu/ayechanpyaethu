import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const supabase = admin.supabase;

  const [
    profiles,
    projects,
    publishedProjects,
    draftProjects,
    archivedProjects,
    skills,
    publishedSkills,
    achievements,
    publishedAchievements,
    draftAchievements,
    interests,
    publishedInterests,
    messages,
    unreadMessages,
    readMessages,
    archivedMessages,
    recentMessages,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase.from("skills").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("achievements").select("id", { count: "exact", head: true }),
    supabase.from("achievements").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("achievements").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("interests").select("id", { count: "exact", head: true }),
    supabase.from("interests").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "unread"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "read"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "archived"),
    supabase
      .from("contact_messages")
      .select("id, sender_name, sender_email, subject, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const results = [
    profiles,
    projects,
    publishedProjects,
    draftProjects,
    archivedProjects,
    skills,
    publishedSkills,
    achievements,
    publishedAchievements,
    draftAchievements,
    interests,
    publishedInterests,
    messages,
    unreadMessages,
    readMessages,
    archivedMessages,
    recentMessages,
  ];

  if (results.some((result) => result.error)) {
    console.error(
      "Unable to load admin overview:",
      results.filter((result) => result.error).map((result) => result.error)
    );

    return NextResponse.json(
      { success: false, error: "Unable to load dashboard overview." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    overview: {
      profiles: { total: profiles.count ?? 0 },
      projects: {
        total: projects.count ?? 0,
        published: publishedProjects.count ?? 0,
        draft: draftProjects.count ?? 0,
        archived: archivedProjects.count ?? 0,
      },
      skills: {
        total: skills.count ?? 0,
        published: publishedSkills.count ?? 0,
      },
      achievements: {
        total: achievements.count ?? 0,
        published: publishedAchievements.count ?? 0,
        draft: draftAchievements.count ?? 0,
      },
      interests: {
        total: interests.count ?? 0,
        published: publishedInterests.count ?? 0,
      },
      messages: {
        total: messages.count ?? 0,
        unread: unreadMessages.count ?? 0,
        read: readMessages.count ?? 0,
        archived: archivedMessages.count ?? 0,
      },
      recentMessages: recentMessages.data ?? [],
    },
  });
}
