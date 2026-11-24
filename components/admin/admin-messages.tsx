"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trash2, Mail, MailOpen, Archive } from "lucide-react";
import type {
  ContactMessageRecord,
  MessageStatus,
} from "@/lib/types/contact-message";

type Filter = "all" | MessageStatus;

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadMessages() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/messages?status=${filter}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load messages.");
      }

      setMessages(result.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMessages();
  }, [filter]);

  async function updateStatus(id: string, status: MessageStatus) {
    setBusyId(id);
    setError("");

    try {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update message.");
      }

      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMessage(id: string) {
    if (!window.confirm("Permanently delete this message?")) return;

    setBusyId(id);
    setError("");

    try {
      const response = await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete message.");
      }

      setMessages((current) => current.filter((message) => message.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Read", value: "read" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#e9eaf0] p-5 text-slate-800 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace / Messages</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Messages</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage messages sent by visitors through your portfolio.
            </p>
          </div>

          <button
            onClick={loadMessages}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium shadow disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                filter === item.value
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              No messages in this category.
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">
                        {message.sender_name || "Website visitor"}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          message.status === "unread"
                            ? "bg-blue-50 text-blue-700"
                            : message.status === "archived"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {message.status}
                      </span>
                    </div>

                    {message.sender_email && (
                      <a
                        href={`mailto:${message.sender_email}`}
                        className="mt-1 inline-block break-all text-sm text-blue-600 hover:underline"
                      >
                        {message.sender_email}
                      </a>
                    )}
                  </div>

                  <time className="text-xs text-slate-400">
                    {new Date(message.created_at).toLocaleString()}
                  </time>
                </div>

                {message.subject && (
                  <h3 className="mt-4 font-medium">{message.subject}</h3>
                )}

                <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
                  {message.message}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {message.status !== "read" && (
                    <button
                      disabled={busyId === message.id}
                      onClick={() => updateStatus(message.id, "read")}
                      className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 disabled:opacity-50"
                    >
                      <MailOpen size={14} /> Mark as read
                    </button>
                  )}

                  {message.status !== "unread" && (
                    <button
                      disabled={busyId === message.id}
                      onClick={() => updateStatus(message.id, "unread")}
                      className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-50"
                    >
                      <Mail size={14} /> Mark as unread
                    </button>
                  )}

                  {message.status !== "archived" && (
                    <button
                      disabled={busyId === message.id}
                      onClick={() => updateStatus(message.id, "archived")}
                      className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-50"
                    >
                      <Archive size={14} /> Archive
                    </button>
                  )}

                  <button
                    disabled={busyId === message.id}
                    onClick={() => deleteMessage(message.id)}
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
