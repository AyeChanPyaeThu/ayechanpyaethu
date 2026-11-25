import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/admin/admin-logout-button";
import AdminSidebar from "@/components/admin/admin-sidebar";

async function ProtectedAdminContent({ children }: { children: ReactNode }) {
  await connection();

  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/admin/login");
  }

  if (claimsData?.claims?.aal !== "aal2") {
    redirect("/admin/login");
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError || roleRecord?.role !== "admin") {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-sm font-semibold">Portfolio administration</p>
          <p className="text-xs text-gray-500">Private administrator area</p>
        </div>

        <AdminLogoutButton />
      </header>

      <div className="flex min-h-[calc(100vh-73px)] flex-col bg-[#e9eaf0] md:flex-row">
        <AdminSidebar />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8">Loading administrator area...</div>
      }
    >
      <ProtectedAdminContent>{children}</ProtectedAdminContent>
    </Suspense>
  );
}
