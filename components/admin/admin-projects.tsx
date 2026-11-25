"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Check,
  Eye,
  EyeOff,
  FolderKanban,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { ProjectImageRecord, ProjectRecord } from "@/lib/types/project";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type AdminProject = ProjectRecord & {
  images: ProjectImageRecord[];
};

type ProjectStatus = "draft" | "published" | "archived";
type Filter = "all" | ProjectStatus;

type ImageDraft = {
  id: string;
  url: string;
  file: File | null;
  previewUrl: string;
};

type ProjectForm = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  role: string;
  technologies: string;
  github_url: string;
  live_demo_url: string;
  status: ProjectStatus;
  is_featured: boolean;
  sort_order: string;
};

const EMPTY_FORM: ProjectForm = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  role: "",
  technologies: "",
  github_url: "",
  live_demo_url: "",
  status: "draft",
  is_featured: false,
  sort_order: "0",
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

async function uploadProjectImage(
  file: File,
  projectId: string,
): Promise<string> {
  const supabase = createSupabaseClient();
  const compressedFile = await compressImage(file);

  const filePath = `projects/${projectId}/${crypto.randomUUID()}.webp`;

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

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [imageDrafts, setImageDrafts] = useState<ImageDraft[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  function clearImagePreviews() {
    previewUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    previewUrlsRef.current = [];
  }

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/projects", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load projects.");
      }

      setProjects(result.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      previewUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const publishedCount = projects.filter(
    (project) => project.status === "published",
  ).length;

  const draftCount = projects.filter(
    (project) => project.status === "draft",
  ).length;

  const archivedCount = projects.filter(
    (project) => project.status === "archived",
  ).length;

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.title.toLowerCase().includes(normalizedSearch) ||
        project.slug.toLowerCase().includes(normalizedSearch) ||
        project.summary.toLowerCase().includes(normalizedSearch) ||
        project.technologies.some((technology) =>
          technology.toLowerCase().includes(normalizedSearch),
        );

      const matchesFilter = filter === "all" || project.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  function openCreateModal() {
    clearImagePreviews();
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setImageDrafts([]);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(project: AdminProject) {
    clearImagePreviews();
    setEditingProject(project);
    setImageDrafts(
      [
        ...(project.cover_image_url
          ? [
              {
                id: `cover-${project.id}`,
                url: project.cover_image_url,
                file: null,
                previewUrl: project.cover_image_url,
              },
            ]
          : []),
        ...[...project.images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((image) => ({
            id: image.id,
            url: image.image_url,
            file: null,
            previewUrl: image.image_url,
          })),
      ].slice(0, 3),
    );

    setForm({
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      description: project.description,
      role: project.role ?? "",
      technologies: project.technologies.join(", "),
      github_url: project.github_url ?? "",
      live_demo_url: project.live_demo_url ?? "",

      status: project.status,
      is_featured: project.is_featured,
      sort_order: String(project.sort_order),
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    clearImagePreviews();
    setModalOpen(false);
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setImageDrafts([]);
  }

  function updateField<K extends keyof ProjectForm>(
    field: K,
    value: ProjectForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = 3 - imageDrafts.length;

    if (remaining <= 0) {
      setError("A project can have a maximum of 3 images.");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remaining);

    const newDrafts: ImageDraft[] = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);

      return {
        id: crypto.randomUUID(),
        url: "",
        file,
        previewUrl,
      };
    });

    setImageDrafts((current) => [...current, ...newDrafts].slice(0, 3));
    setError("");
  }

  function removeImageDraft(id: string) {
    const image = imageDrafts.find((item) => item.id === id);

    if (image?.file) {
      URL.revokeObjectURL(image.previewUrl);
      previewUrlsRef.current = previewUrlsRef.current.filter(
        (url) => url !== image.previewUrl,
      );
    }

    setImageDrafts((current) => current.filter((item) => item.id !== id));
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const technologies = form.technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (imageDrafts.length > 3) {
      setError("A project can have a maximum of 3 images.");
      setSaving(false);
      return;
    }

    const payload = {
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      role: form.role.trim() || null,
      technologies,
      github_url: form.github_url.trim() || null,
      live_demo_url: form.live_demo_url.trim() || null,
      status: form.status,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order),
    };

    try {
      let projectId = editingProject?.id;

      // Create the project first if it is new.
      if (!projectId) {
        const createResponse = await fetch("/api/admin/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok || !createResult.success) {
          throw new Error(createResult.error || "Unable to create project.");
        }

        projectId = createResult.project?.id;

        if (!projectId) {
          throw new Error(
            "Project was created, but its ID could not be retrieved.",
          );
        }
      }

      // Upload new files and preserve existing image URLs.
      const imageUrls = await Promise.all(
        imageDrafts.map(async (image) => {
          if (image.file) {
            return uploadProjectImage(image.file, projectId!);
          }

          return image.url;
        }),
      );

      // The first image is the cover; the remaining images are the gallery.
      const coverImageUrl = imageUrls[0] || null;

      const galleryImages = imageUrls.slice(1).map((image_url, index) => ({
        image_url,
        alt_text: `${form.title.trim()} gallery image ${index + 1}`,
        sort_order: index,
      }));

      const response = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          ...payload,
          cover_image_url: coverImageUrl,
          images: galleryImages,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save project images.");
      }

      setSuccess(
        editingProject
          ? "Project updated successfully."
          : "Project created successfully.",
      );

      setSuccess(
        editingProject
          ? "Project updated successfully."
          : "Project created successfully.",
      );

      clearImagePreviews();
      setModalOpen(false);
      setModalOpen(false);
      setEditingProject(null);
      setForm(EMPTY_FORM);
      setImageDrafts([]);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(
    project: AdminProject,
    updates: Partial<ProjectRecord>,
    message: string,
  ) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, ...updates }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update project.");
      }

      setSuccess(message);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update project.",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete project.");
      }

      setSuccess("Project deleted successfully.");
      setDeleteTarget(null);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete project.",
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
            <p className="text-sm text-slate-500">Workspace / Projects</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-[3px_3px_8px_#c9cad0,-3px_-3px_8px_#ffffff]">
                <FolderKanban size={22} />
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Projects Management
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Manage your portfolio projects, galleries, and publication status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadProjects()}
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
              Add project
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
              label: "Total projects",
              value: projects.length,
              icon: FolderKanban,
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
              icon: Archive,
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
                placeholder="Search projects or technologies..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All projects"],
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
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </section>

        {/* Project list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Your projects</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage the projects displayed on your public portfolio.
              </p>
            </div>
            <Sparkles size={20} className="text-blue-500" />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl bg-[#e9eaf0] shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                Loading your projects...
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl bg-[#e9eaf0] px-6 py-16 text-center shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]">
              <FolderKanban size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-bold">
                {projects.length === 0
                  ? "No projects added yet"
                  : "No matching projects found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {projects.length === 0
                  ? "Start building your portfolio by adding your first project."
                  : "Try a different search term or filter."}
              </p>
              {projects.length === 0 && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add your first project
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-[#e9eaf0] shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff] transition duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_15px_#c9cad0,-7px_-7px_15px_#ffffff]"
                >
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-slate-200">
                    {project.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.cover_image_url}
                        alt={`${project.title} cover`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ImageIcon size={32} />
                        <span className="text-xs">No cover image</span>
                      </div>
                    )}

                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold ${
                        project.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : project.status === "draft"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_LABELS[project.status]}
                    </span>

                    {project.is_featured && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                        <Star size={12} fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        /{project.slug}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-800">
                        {project.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {project.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.technologies.slice(0, 4).map((technology) => (
                          <span
                            key={technology}
                            className="rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {technology}
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="rounded-lg bg-white/70 px-2.5 py-1 text-[11px] text-slate-500">
                            +{project.technologies.length - 4}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        {project.images.length} gallery image
                        {project.images.length === 1 ? "" : "s"} · Order:{" "}
                        {project.sort_order}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-4">
                      <button
                        onClick={() =>
                          void updateProject(
                            project,
                            { is_featured: !project.is_featured },
                            project.is_featured
                              ? "Project removed from featured."
                              : "Project marked as featured.",
                          )
                        }
                        title={
                          project.is_featured
                            ? "Remove from featured"
                            : "Mark as featured"
                        }
                        aria-label={
                          project.is_featured
                            ? `Unfeature ${project.title}`
                            : `Feature ${project.title}`
                        }
                        className={`rounded-lg p-2 transition ${
                          project.is_featured
                            ? "text-amber-500 hover:bg-amber-50"
                            : "text-slate-400 hover:bg-white hover:text-amber-500"
                        }`}
                      >
                        <Star
                          size={17}
                          fill={project.is_featured ? "currentColor" : "none"}
                        />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            void updateProject(
                              project,
                              {
                                status:
                                  project.status === "published"
                                    ? "draft"
                                    : "published",
                              },
                              project.status === "published"
                                ? "Project moved to drafts."
                                : "Project published successfully.",
                            )
                          }
                          title={
                            project.status === "published"
                              ? "Move to drafts"
                              : "Publish project"
                          }
                          aria-label={
                            project.status === "published"
                              ? `Unpublish ${project.title}`
                              : `Publish ${project.title}`
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                        >
                          {project.status === "published" ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            void updateProject(
                              project,
                              {
                                status:
                                  project.status === "archived"
                                    ? "draft"
                                    : "archived",
                              },
                              project.status === "archived"
                                ? "Project restored to drafts."
                                : "Project archived successfully.",
                            )
                          }
                          title={
                            project.status === "archived"
                              ? "Restore project"
                              : "Archive project"
                          }
                          aria-label={
                            project.status === "archived"
                              ? `Restore ${project.title}`
                              : `Archive ${project.title}`
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                        >
                          <Archive size={17} />
                        </button>

                        <button
                          onClick={() => openEditModal(project)}
                          title="Edit project"
                          aria-label={`Edit ${project.title}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(project)}
                          title="Delete project"
                          aria-label={`Delete ${project.title}`}
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
            aria-labelledby="project-modal-title"
            className="my-auto w-full max-w-2xl rounded-3xl bg-[#e9eaf0] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Projects workspace
                </p>
                <h2 id="project-modal-title" className="mt-2 text-xl font-bold">
                  {editingProject ? "Edit project" : "Add a new project"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add project details and image URLs for your portfolio.
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

            <form
              onSubmit={handleSubmit}
              className="max-h-[70vh] space-y-5 overflow-y-auto px-1"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="project-title">
                    Project title *
                  </label>
                  <input
                    id="project-title"
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="e.g. Portfolio Website"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="project-slug">
                    URL slug *
                  </label>
                  <input
                    id="project-slug"
                    required
                    maxLength={120}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={form.slug}
                    onChange={(event) =>
                      updateField("slug", event.target.value)
                    }
                    placeholder="e.g. portfolio-website"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="project-summary">
                  Short summary *
                </label>
                <textarea
                  id="project-summary"
                  required
                  rows={2}
                  maxLength={500}
                  value={form.summary}
                  onChange={(event) =>
                    updateField("summary", event.target.value)
                  }
                  placeholder="A short introduction to this project..."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="project-description">
                  Full description *
                </label>
                <textarea
                  id="project-description"
                  required
                  rows={5}
                  maxLength={10000}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Describe the project, its purpose, features, and implementation..."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="project-role">
                    Your role
                  </label>
                  <input
                    id="project-role"
                    maxLength={200}
                    value={form.role}
                    onChange={(event) =>
                      updateField("role", event.target.value)
                    }
                    placeholder="e.g. Frontend Developer"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="project-technologies">
                    Technologies
                  </label>
                  <input
                    id="project-technologies"
                    value={form.technologies}
                    onChange={(event) =>
                      updateField("technologies", event.target.value)
                    }
                    placeholder="React, Next.js, Supabase"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate technologies with commas.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Project Images</label>
                  <span className="text-xs text-slate-500">
                    {imageDrafts.length}/3 images
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {imageDrafts.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative overflow-hidden rounded-xl border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.previewUrl}
                        alt={`Project image ${index + 1}`}
                        className="h-36 w-full object-cover"
                      />

                      <div className="p-2 text-xs text-slate-500">
                        {index === 0 ? "Cover image" : `Gallery image ${index}`}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeImageDraft(image.id)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {imageDrafts.length < 3 && (
                  <div>
                    <label
                      htmlFor="project-image-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm hover:border-blue-500"
                    >
                      <Plus size={16} />
                      Add images
                    </label>

                    <input
                      id="project-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        addImageFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      JPG, PNG, or WebP. Maximum 3 images per project, including
                      the cover.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="project-github">
                    GitHub URL
                  </label>
                  <input
                    id="project-github"
                    type="text"
                    maxLength={2048}
                    value={form.github_url}
                    onChange={(event) =>
                      updateField("github_url", event.target.value)
                    }
                    placeholder="https://github.com/..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="project-demo">
                    Live demo URL
                  </label>
                  <input
                    id="project-demo"
                    type="text"
                    maxLength={2048}
                    value={form.live_demo_url}
                    onChange={(event) =>
                      updateField("live_demo_url", event.target.value)
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="project-status">
                    Publication status
                  </label>
                  <select
                    id="project-status"
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value as ProjectStatus)
                    }
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="project-order">
                    Display order
                  </label>
                  <input
                    id="project-order"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) =>
                      updateField("sort_order", event.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/60 p-4">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) =>
                    updateField("is_featured", event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-700">
                    Feature this project
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Include it in the featured projects section when published.
                  </span>
                </span>
              </label>

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
                    : editingProject
                      ? "Save changes"
                      : "Create project"}
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
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-3xl bg-[#e9eaf0] p-7 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-project-title" className="mt-5 text-xl font-bold">
              Delete this project?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete{" "}
              <strong className="text-slate-700">{deleteTarget.title}</strong>.
              Its gallery images will also be deleted. This action cannot be
              undone.
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
