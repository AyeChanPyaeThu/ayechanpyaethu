"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  Code2,
  FolderKanban,
  Award,
  Heart,
  MessageSquare,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Profile", href: "/admin/profile", icon: UserRound },
  { label: "Skills", href: "/admin/skills", icon: Code2 },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Achievements", href: "/admin/achievements", icon: Award },
  { label: "Interests", href: "/admin/interests", icon: Heart },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Settings", href: null, icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sticky top-0 z-40 w-full shrink-0 border-b border-white/70 bg-[#e9eaf0] p-4 md:min-h-[calc(100vh-73px)] md:w-64 md:border-b-0 md:border-r md:p-5">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex w-full items-center justify-between text-gray-600 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow md:hidden"
        aria-expanded={menuOpen}
      >
        <span className="flex items-center text-center gap-2">Navigation</span>
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className={`${menuOpen ? "block" : "hidden"} mt-5 md:block`}>
        <p className="mb-5 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : item.href !== null && pathname.startsWith(item.href);

            if (!item.href) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-slate-400"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  <span className="text-[10px]">Soon</span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  active
                    ? "bg-white font-semibold text-blue-700 shadow-[4px_4px_10px_#c8c9cf,-4px_-4px_10px_#ffffff]"
                    : "text-slate-500 hover:bg-white/70 hover:text-blue-700"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
