"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import type { Profile } from "@/lib/types/profile";

type ProfileForm = {
  display_name: string;
  headline: string;
  biography: string;
  location: string;
  public_email: string;
  avatar_url: string;
  resume_url: string;
  social_links: string;
  is_public: boolean;
};

const emptyForm: ProfileForm = {
  display_name: "",
  headline: "",
  biography: "",
  location: "",
  public_email: "",
  avatar_url: "",
  resume_url: "",
  social_links: "{}",
  is_public: true,
};

export default function AdminProfile() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/profile", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load profile.");
      }

      const profile = result.profile as Profile | null;

      if (profile) {
        setForm({
          display_name: profile.display_name ?? "",
          headline: profile.headline ?? "",
          biography: profile.biography ?? "",
          location: profile.location ?? "",
          public_email: profile.public_email ?? "",
          avatar_url: profile.avatar_url ?? "",
          resume_url: profile.resume_url ?? "",
          social_links: JSON.stringify(profile.social_links ?? {}, null, 2),
          is_public: profile.is_public,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    let socialLinks: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(form.social_links);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Social links must be a JSON object.");
      }
      socialLinks = parsed as Record<string, unknown>;
    } catch {
      setError("Please enter valid JSON for social links.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          location: form.location || null,
          public_email: form.public_email || null,
          avatar_url: form.avatar_url || null,
          resume_url: form.resume_url || null,
          social_links: socialLinks,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save profile.");
      }

      setSuccess("Profile saved successfully.");
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "display_name", label: "Display name", required: true },
    { key: "headline", label: "Professional headline" },
    { key: "location", label: "Location" },
    { key: "public_email", label: "Public email", type: "email" },
    { key: "avatar_url", label: "Avatar image URL" },
    { key: "resume_url", label: "Resume URL" },
  ] as const;

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#e9eaf0] p-5 text-slate-800 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace / Profile</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Profile editor
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Update the information displayed on your portfolio.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProfile}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm shadow"
          >
            <RefreshCw size={16} /> Reload
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={saveProfile}
          className="space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8"
        >
          {fields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-2 block text-sm font-medium">
                {field.label}
                {"required" in field && field.required && " *"}
              </span>
              <input
                type={"type" in field ? field.type : "text"}
                required={"required" in field && field.required}
                value={form[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Biography</span>
            <textarea
              rows={7}
              maxLength={5000}
              value={form.biography}
              onChange={(event) => updateField("biography", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Social links (JSON)
            </span>
            <textarea
              rows={5}
              value={form.social_links}
              onChange={(event) =>
                updateField("social_links", event.target.value)
              }
              spellCheck={false}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <span className="mt-2 block text-xs text-slate-500">
              Keep this as a valid JSON object. Existing social links are loaded
              automatically.
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) =>
                updateField("is_public", event.target.checked)
              }
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-medium">
              Make profile publicly visible
            </span>
          </label>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
