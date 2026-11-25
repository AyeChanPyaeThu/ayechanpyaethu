"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Code2,
  Award,
  Heart,
  MessageSquare,
  UserRound,
  RefreshCw,
} from "lucide-react";

type OverviewData = {
  profiles: { total: number };
  projects: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  skills: { total: number; published: number };
  achievements: { total: number; published: number; draft: number };
  interests: { total: number; published: number };
  messages: { total: number; unread: number; read: number; archived: number };
  recentMessages: {
    id: string;
    sender_name: string | null;
    sender_email: string | null;
    subject: string | null;
    message: string;
    status: string;
    created_at: string;
  }[];
};

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOverview() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/overview", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load dashboard.");
      }

      setData(result.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const cards = data
    ? [
        {
          label: "Projects",
          value: data.projects.total,
          detail: `${data.projects.published} published`,
          icon: FolderKanban,
        },
        {
          label: "Skills",
          value: data.skills.total,
          detail: `${data.skills.published} published`,
          icon: Code2,
        },
        {
          label: "Achievements",
          value: data.achievements.total,
          detail: `${data.achievements.published} published`,
          icon: Award,
        },
        {
          label: "Interests",
          value: data.interests.total,
          detail: `${data.interests.published} published`,
          icon: Heart,
        },
        {
          label: "Messages",
          value: data.messages.total,
          detail: `${data.messages.unread} unread`,
          icon: MessageSquare,
        },
        {
          label: "Profiles",
          value: data.profiles.total,
          detail: "Profile records",
          icon: UserRound,
        },
      ]
    : [];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#e9eaf0] text-slate-800">
      <div className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-slate-500">Workspace / Overview</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Welcome back. Here's your portfolio at a glance.
                </p>
              </div>
            </div>

            <button
              onClick={loadOverview}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium shadow-[3px_3px_8px_#c8c9cf,-3px_-3px_8px_#ffffff] disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              <button
                onClick={loadOverview}
                className="ml-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-2xl bg-[#e9eaf0] p-6 shadow-[6px_6px_14px_#c9cad0,-6px_-6px_14px_#ffffff]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {card.label}
                    </p>
                    <Icon size={21} className="text-blue-600" />
                  </div>
                  <p className="mt-4 text-3xl font-bold">
                    {loading ? "—" : card.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
                </article>
              );
            })}
          </section>

          <section className="mt-8 rounded-2xl bg-[#e9eaf0] p-6 shadow-[6px_6px_14px_#c9cad0,-6px_-6px_14px_#ffffff]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Recent messages</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest messages from your portfolio visitors
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {data?.messages.unread ?? 0} unread
              </span>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading messages...
              </p>
            ) : data?.recentMessages.length ? (
              <div className="divide-y divide-slate-200">
                {data.recentMessages.map((message) => (
                  <article key={message.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {message.sender_name || "Website visitor"}
                      </p>
                      <span className="text-xs text-slate-400">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    {message.sender_email && (
                      <p className="mt-1 text-xs text-slate-500">
                        {message.sender_email}
                      </p>
                    )}
                    {message.subject && (
                      <p className="mt-2 text-sm font-medium">
                        {message.subject}
                      </p>
                    )}
                    <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-slate-600">
                      {message.message}
                    </p>
                    <span className="mt-2 inline-block text-xs capitalize text-slate-400">
                      {message.status}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                No messages yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
