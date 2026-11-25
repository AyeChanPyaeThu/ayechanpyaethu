"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
  Award,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { AchievementRecord } from "@/lib/types/achievement";

type AchievementStatus = "draft" | "published" | "archived";

type AchievementForm = {
  title: string;
  issuer: string;
  description: string;
  achieved_on: string;
  credential_url: string;
  sort_order: string;
  status: AchievementStatus;
};

type ImageDraft = {
  id: string;
  url: string;
  file: File | null;
  previewUrl: string;
};

type Filter = "all" | AchievementStatus;

const EMPTY_FORM: AchievementForm = {
  title: "",
  issuer: "",
  description: "",
  achieved_on: "",
  credential_url: "",
  sort_order: "0",
  status: "draft",
};

async function compressImage(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Please select a JPG, PNG, or WebP image.");
  }

  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Unable to process this image.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Image compression failed.")),
      "image/webp",
      0.82,
    );
  });

  const filename = `${file.name.replace(/\.[^.]+$/, "")}.webp`;

  return new File([blob], filename, {
    type: "image/webp",
  });
}

async function uploadAchievementImage(
  file: File,
  achievementId: string,
): Promise<string> {
  const supabase = createSupabaseClient();
  const compressedFile = await compressImage(file);

  const filePath = `achievements/${achievementId}/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from("portfolio-media")
    .upload(filePath, compressedFile, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("portfolio-media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] =
    useState<AchievementRecord | null>(null);
  const [form, setForm] = useState<AchievementForm>(EMPTY_FORM);

  const [images, setImages] = useState<ImageDraft[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AchievementRecord | null>(
    null,
  );

  const previewUrlsRef = useRef<string[]>([]);

  const clearImagePreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearImagePreviews();
  }, [clearImagePreviews]);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/achievements", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load achievements.");
      }

      setAchievements(result.achievements ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  const publishedCount = achievements.filter(
    (item) => item.status === "published",
  ).length;

  const draftCount = achievements.filter(
    (item) => item.status === "draft",
  ).length;

  const archivedCount = achievements.filter(
    (item) => item.status === "archived",
  ).length;

  const filteredAchievements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return achievements.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        (item.issuer ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.description ?? "").toLowerCase().includes(normalizedSearch);

      const matchesFilter = filter === "all" || item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [achievements, search, filter]);

  function openCreateModal() {
    clearImagePreviews();
    setEditingAchievement(null);
    setForm(EMPTY_FORM);
    setImages([]);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(item: AchievementRecord) {
    clearImagePreviews();

    setEditingAchievement(item);

    setForm({
      title: item.title,
      issuer: item.issuer ?? "",
      description: item.description ?? "",
      achieved_on: item.achieved_on ?? "",
      credential_url: item.credential_url ?? "",
      sort_order: String(item.sort_order),
      status: item.status,
    });

    const existingImages = [
      ...(item.image_url ? [item.image_url] : []),
      ...(item.image_urls ?? []),
    ];

    setImages(
      existingImages.map((url, index) => ({
        id: `existing-${index}`,
        url,
        file: null,
        previewUrl: url,
      })),
    );

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    clearImagePreviews();
    setModalOpen(false);
    setEditingAchievement(null);
    setForm(EMPTY_FORM);
    setImages([]);
  }

  function addImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    setError("");

    const newImages = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);

      return {
        id: crypto.randomUUID(),
        url: "",
        file,
        previewUrl,
      };
    });

    setImages((current) => [...current, ...newImages]);
  }

  function removeImageDraft(imageId: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === imageId);

      if (image?.file) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter(
          (url) => url !== image.previewUrl,
        );
      }

      return current.filter((item) => item.id !== imageId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title: form.title.trim(),
      issuer: form.issuer.trim() || null,
      description: form.description.trim() || null,
      achieved_on: form.achieved_on || null,
      credential_url: form.credential_url.trim() || null,
      sort_order: Number(form.sort_order),
      status: form.status,
    };

    try {
      let achievementId = editingAchievement?.id;

      // Create the database record first when adding a new achievement.
      if (!editingAchievement) {
        const response = await fetch("/api/admin/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to create achievement.");
        }

        achievementId = result.achievement.id;
      }

      if (!achievementId) {
        throw new Error("Achievement ID is missing.");
      }

      // Keep existing image URLs and upload newly selected files.
      const uploadedImages: string[] = [];

      for (const image of images) {
        if (image.file) {
          const url = await uploadAchievementImage(image.file, achievementId);
          uploadedImages.push(url);
        } else if (image.url) {
          uploadedImages.push(image.url);
        }
      }

      const imagePayload = {
        image_url: uploadedImages[0] ?? null,
        image_urls: uploadedImages.slice(1),
      };

      // Update the record with its final details and image URLs.
      const updateResponse = await fetch("/api/admin/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: achievementId,
          ...payload,
          ...imagePayload,
        }),
      });

      const updateResult = await updateResponse.json();

      if (!updateResponse.ok || !updateResult.success) {
        throw new Error(
          updateResult.error || "Unable to save achievement images.",
        );
      }

      setSuccess(
        editingAchievement
          ? "Achievement updated successfully."
          : "Achievement created successfully.",
      );

      clearImagePreviews();
      setModalOpen(false);
      setEditingAchievement(null);
      setForm(EMPTY_FORM);
      setImages([]);

      await loadAchievements();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save achievement.",
      );
      // Reload to include a newly created draft if its image upload failed.
      await loadAchievements();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    item: AchievementRecord,
    status: AchievementStatus,
  ) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update status.");
      }

      setSuccess(`Achievement moved to ${status}.`);
      await loadAchievements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/achievements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete achievement.");
      }

      setSuccess("Achievement deleted successfully.");
      setDeleteTarget(null);
      await loadAchievements();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete achievement.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200/80 bg-[#f5f6fa] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-600";

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#e9eaf0] px-5 py-7 text-slate-800 sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace / Achievements</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-[3px_3px_8px_#c9cad0,-3px_-3px_8px_#ffffff]">
                <Award size={22} />
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Achievements Management
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Organize and showcase your certificates, awards, and milestones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadAchievements()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#e9eaf0] px-4 py-3 text-sm font-semibold text-slate-600 shadow-[4px_4px_9px_#c9cad0,-4px_-4px_9px_#ffffff] transition hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add achievement
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <X size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <Check size={18} />
            {success}
            <button
              onClick={() => setSuccess("")}
              className="ml-auto"
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total achievements",
              value: achievements.length,
              icon: Award,
              color: "text-blue-600",
            },
            {
              label: "Published",
              value: publishedCount,
              icon: Eye,
              color: "text-emerald-600",
            },
            {
              label: "Drafts",
              value: draftCount,
              icon: EyeOff,
              color: "text-amber-600",
            },
            {
              label: "Archived",
              value: archivedCount,
              icon: ImageIcon,
              color: "text-slate-500",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-2xl bg-[#e9eaf0] p-5 shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <Icon size={20} className={item.color} />
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {loading ? "—" : item.value}
                </p>
              </article>
            );
          })}
        </section>

        {/* Search and filters */}
        <section className="mb-6 rounded-2xl bg-[#e9eaf0] p-4 shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff] sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search achievements or issuers..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["published", "Published"],
                  ["draft", "Drafts"],
                  ["archived", "Archived"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-[#e9eaf0] text-slate-500 shadow-[3px_3px_7px_#c9cad0,-3px_-3px_7px_#ffffff] hover:text-blue-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Showing {filteredAchievements.length} of {achievements.length}{" "}
            achievements
          </p>
        </section>

        {/* Achievement list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Your achievements</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage the achievements displayed on your public portfolio.
              </p>
            </div>
            <Sparkles size={20} className="text-blue-500" />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl bg-[#e9eaf0] shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                Loading your achievements...
              </div>
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="rounded-2xl bg-[#e9eaf0] px-6 py-16 text-center shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]">
              <Award size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-bold">
                {achievements.length === 0
                  ? "No achievements added yet"
                  : "No matching achievements found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {achievements.length === 0
                  ? "Start showcasing your milestones by adding your first achievement."
                  : "Try a different search term or filter."}
              </p>
              {achievements.length === 0 && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add your first achievement
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAchievements.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-[#e9eaf0] shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff] transition duration-200 hover:-translate-y-0.5"
                >
                  {item.image_url ? (
                    <div className="aspect-16/10 overflow-hidden bg-slate-100">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-16/10 items-center justify-center bg-slate-100 text-slate-300">
                      <ImageIcon size={42} />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        {item.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                          item.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "archived"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.issuer && (
                      <p className="mt-2 text-xs font-semibold text-blue-600">
                        {item.issuer}
                      </p>
                    )}

                    {item.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {item.achieved_on && (
                        <span>
                          Achieved:{" "}
                          {new Date(
                            `${item.achieved_on}T00:00:00`,
                          ).toLocaleDateString()}
                        </span>
                      )}
                      <span>Order: {item.sort_order}</span>
                      <span>
                        {(item.image_urls?.length ?? 0) +
                          (item.image_url ? 1 : 0)}{" "}
                        image(s)
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-200/80 pt-4">
                      <span className="text-xs text-slate-400">
                        {item.credential_url
                          ? "Credential linked"
                          : "No credential link"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            void updateStatus(
                              item,
                              item.status === "published"
                                ? "draft"
                                : "published",
                            )
                          }
                          title={
                            item.status === "published"
                              ? "Move to drafts"
                              : "Publish"
                          }
                          aria-label={
                            item.status === "published"
                              ? `Unpublish ${item.title}`
                              : `Publish ${item.title}`
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                        >
                          {item.status === "published" ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit achievement"
                          aria-label={`Edit ${item.title}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete achievement"
                          aria-label={`Delete ${item.title}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievement-modal-title"
            className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#e9eaf0] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Achievements workspace
                </p>
                <h2
                  id="achievement-modal-title"
                  className="mt-2 text-xl font-bold"
                >
                  {editingAchievement
                    ? "Edit achievement"
                    : "Add a new achievement"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add details and upload certificate or award images.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="achievement-title">
                  Achievement title *
                </label>
                <input
                  id="achievement-title"
                  required
                  maxLength={160}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. First Prize - University Project Show"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="achievement-issuer">
                    Issuer / Organization
                  </label>
                  <input
                    id="achievement-issuer"
                    maxLength={160}
                    value={form.issuer}
                    onChange={(event) =>
                      setForm({ ...form, issuer: event.target.value })
                    }
                    placeholder="e.g. Yangon University"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="achievement-date">
                    Date achieved
                  </label>
                  <input
                    id="achievement-date"
                    type="date"
                    value={form.achieved_on}
                    onChange={(event) =>
                      setForm({ ...form, achieved_on: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="achievement-description">
                  Description
                </label>
                <textarea
                  id="achievement-description"
                  rows={4}
                  maxLength={3000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe this achievement..."
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/3000
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="achievement-credential">
                  Credential / Verification URL
                </label>
                <input
                  id="achievement-credential"
                  type="url"
                  maxLength={2048}
                  value={form.credential_url}
                  onChange={(event) =>
                    setForm({ ...form, credential_url: event.target.value })
                  }
                  placeholder="https://example.com/verify"
                  className={inputClass}
                />
              </div>

              {/* Image upload */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-600">
                    Achievement images
                  </label>
                  <span className="text-xs text-slate-400">
                    {images.length} images
                  </span>
                </div>

                <div className="rounded-2xl bg-[#e9eaf0] p-4 shadow-[inset_4px_4px_8px_#c8c9ce,inset_-4px_-4px_8px_#ffffff]">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative overflow-hidden rounded-xl bg-white"
                      >
                        <div className="aspect-4/3">
                          <img
                            src={image.previewUrl}
                            alt={`Achievement image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                            Main image
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageDraft(image.id)}
                          disabled={saving}
                          aria-label={`Remove image ${index + 1}`}
                          className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow transition hover:bg-red-50"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}

                    {true && (
                      <label className="flex aspect-4/3 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/60 text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                        <Upload size={24} />
                        <span className="mt-2 text-xs font-semibold">
                          Add image
                        </span>
                        <span className="mt-1 text-[10px]">JPG, PNG, WebP</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          disabled={saving}
                          onChange={(event) => {
                            addImageFiles(event.target.files);
                            event.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Images are automatically resized to a maximum dimension of
                    1600px and compressed to WebP before upload. The first image
                    is the main image. You can add as many images as you need.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="achievement-order">
                    Display order
                  </label>
                  <input
                    id="achievement-order"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) =>
                      setForm({ ...form, sort_order: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="achievement-status">
                    Publication status
                  </label>
                  <select
                    id="achievement-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as AchievementStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  {saving
                    ? "Saving..."
                    : editingAchievement
                      ? "Save changes"
                      : "Create achievement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-achievement-title"
            className="w-full max-w-md rounded-3xl bg-[#e9eaf0] p-7 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2
              id="delete-achievement-title"
              className="mt-5 text-xl font-bold"
            >
              Delete this achievement?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete{" "}
              <strong className="text-slate-700">{deleteTarget.title}</strong>.
              This action cannot be undone.
            </p>
            <p className="mt-2 text-xs text-amber-700">
              Uploaded Storage images are not automatically deleted by the
              current API.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deletingId !== null}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deletingId ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
