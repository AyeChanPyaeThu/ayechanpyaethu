"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Bot,
  Brain,
  Check,
  Code2,
  Cpu,
  Database,
  Eye,
  EyeOff,
  FileCode2,
  GitBranch,
  Globe,
  Layers,
  Lightbulb,
  Loader2,
  Monitor,
  Network,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import type { Skill } from "@/lib/types/skill";

const SKILL_ICONS = [
  { name: "code", label: "Code", Icon: Code2 },
  { name: "terminal", label: "Terminal", Icon: Terminal },
  { name: "database", label: "Database", Icon: Database },
  { name: "brain", label: "AI / ML", Icon: Brain },
  { name: "bot", label: "Artificial Intelligence", Icon: Bot },
  { name: "cpu", label: "Computer Systems", Icon: Cpu },
  { name: "globe", label: "Web Development", Icon: Globe },
  { name: "palette", label: "Design", Icon: Palette },
  { name: "monitor", label: "Desktop", Icon: Monitor },
  { name: "smartphone", label: "Mobile", Icon: Smartphone },
  { name: "network", label: "Networking", Icon: Network },
  { name: "server", label: "Server", Icon: Server },
  { name: "git-branch", label: "Version Control", Icon: GitBranch },
  { name: "file-code", label: "Programming", Icon: FileCode2 },
  { name: "layers", label: "Frameworks", Icon: Layers },
  { name: "shield-check", label: "Security", Icon: ShieldCheck },
  { name: "lightbulb", label: "Problem Solving", Icon: Lightbulb },
  { name: "wrench", label: "Tools", Icon: Wrench },
] as const;

type SkillForm = {
  name: string;
  category: string;
  description: string;
  proficiency_label: string;
  icon: string;
  sort_order: string;
  is_published: boolean;
};

const EMPTY_FORM: SkillForm = {
  name: "",
  category: "",
  description: "",
  proficiency_label: "",
  icon: "code",
  sort_order: "0",
  is_published: false,
};

type Filter = "all" | "published" | "draft";

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form, setForm] = useState<SkillForm>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/skills", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load skills.");
      }

      setSkills(result.skills ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const publishedCount = skills.filter((skill) => skill.is_published).length;

  const draftCount = skills.length - publishedCount;

  const filteredSkills = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        !normalizedSearch ||
        skill.name.toLowerCase().includes(normalizedSearch) ||
        skill.category.toLowerCase().includes(normalizedSearch) ||
        (skill.description ?? "").toLowerCase().includes(normalizedSearch) ||
        (skill.icon ?? "").toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "published" && skill.is_published) ||
        (filter === "draft" && !skill.is_published);

      return matchesSearch && matchesFilter;
    });
  }, [skills, search, filter]);

  const SelectedSkillIcon =
    SKILL_ICONS.find((item) => item.name === form.icon)?.Icon ?? Code2;

  const filteredSkillIcons = SKILL_ICONS.filter((item) =>
    `${item.label} ${item.name}`
      .toLowerCase()
      .includes(iconSearch.trim().toLowerCase()),
  );

  function openCreateModal() {
    setIconSearch("");
    setEditingSkill(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setModalOpen(true);
    setIconSearch("");
  }

  function openEditModal(skill: Skill) {
    setIconSearch("");
    setEditingSkill(skill);
    setForm({
      name: skill.name,
      category: skill.category,
      description: skill.description ?? "",
      proficiency_label: skill.proficiency_label ?? "",
      icon: skill.icon ?? "code",
      sort_order: String(skill.sort_order),
      is_published: skill.is_published,
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingSkill(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim() || null,
      proficiency_label: form.proficiency_label.trim() || null,
      icon: form.icon || null,
      sort_order: Number(form.sort_order),
      is_published: form.is_published,
    };

    try {
      const response = await fetch("/api/admin/skills", {
        method: editingSkill ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingSkill ? { id: editingSkill.id, ...payload } : payload,
        ),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save skill.");
      }

      setSuccess(
        editingSkill
          ? "Skill updated successfully."
          : "Skill created successfully.",
      );

      setModalOpen(false);
      setEditingSkill(null);
      setForm(EMPTY_FORM);
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save skill.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(skill: Skill) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: skill.id,
          is_published: !skill.is_published,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update publication.");
      }

      setSuccess(
        skill.is_published
          ? "Skill moved to drafts."
          : "Skill published successfully.",
      );
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update skill.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete skill.");
      }

      setSuccess("Skill deleted successfully.");
      setDeleteTarget(null);
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete skill.");
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
            <p className="text-sm text-slate-500">Workspace / Skills</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-[3px_3px_8px_#c9cad0,-3px_-3px_8px_#ffffff]">
                <Code2 size={22} />
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Skills Management
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Organize and showcase your technical and professional skills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadSkills()}
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
              Add skill
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
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total skills",
              value: skills.length,
              icon: Code2,
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
                placeholder="Search skills or categories..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All skills"],
                  ["published", "Published"],
                  ["draft", "Drafts"],
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
            Showing {filteredSkills.length} of {skills.length} skills
          </p>
        </section>

        {/* Skill list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Your skills</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage the skills displayed on your public portfolio.
              </p>
            </div>
            <Sparkles size={20} className="text-blue-500" />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl bg-[#e9eaf0] shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                Loading your skills...
              </div>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="rounded-2xl bg-[#e9eaf0] px-6 py-16 text-center shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff]">
              <Award size={36} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-bold">
                {skills.length === 0
                  ? "No skills added yet"
                  : "No matching skills found"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {skills.length === 0
                  ? "Start building your skills collection by adding your first skill."
                  : "Try a different search term or filter."}
              </p>
              {skills.length === 0 && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add your first skill
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredSkills.map((skill) => (
                <article
                  key={skill.id}
                  className="group flex flex-col rounded-2xl bg-[#e9eaf0] p-5 shadow-[5px_5px_12px_#c9cad0,-5px_-5px_12px_#ffffff] transition duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_15px_#c9cad0,-7px_-7px_15px_#ffffff]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      {(() => {
                        const SkillIcon =
                          SKILL_ICONS.find((item) => item.name === skill.icon)
                            ?.Icon ?? Code2;

                        return <SkillIcon size={19} />;
                      })()}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        skill.is_published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {skill.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="mt-5 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      {skill.category}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-800">
                      {skill.name}
                    </h3>
                    {skill.proficiency_label && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {skill.proficiency_label}
                      </p>
                    )}
                    {skill.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                        {skill.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4">
                    <span className="text-xs text-slate-400">
                      Order: {skill.sort_order}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void togglePublished(skill)}
                        title={skill.is_published ? "Unpublish" : "Publish"}
                        aria-label={
                          skill.is_published
                            ? `Unpublish ${skill.name}`
                            : `Publish ${skill.name}`
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                      >
                        {skill.is_published ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(skill)}
                        title="Edit skill"
                        aria-label={`Edit ${skill.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-blue-600"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(skill)}
                        title="Delete skill"
                        aria-label={`Delete ${skill.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
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
            aria-labelledby="skill-modal-title"
            className="my-auto w-full max-w-xl rounded-3xl bg-[#e9eaf0] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Skills workspace
                </p>
                <h2 id="skill-modal-title" className="mt-2 text-xl font-bold">
                  {editingSkill ? "Edit skill" : "Add a new skill"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add clear details to showcase your abilities.
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
                <label className={labelClass} htmlFor="skill-name">
                  Skill name *
                </label>
                <input
                  id="skill-name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. React, Python, UI Design"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="skill-category">
                    Category *
                  </label>
                  <input
                    id="skill-category"
                    required
                    maxLength={80}
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    placeholder="e.g. Frontend"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="skill-proficiency">
                    Proficiency label
                  </label>
                  <input
                    id="skill-proficiency"
                    maxLength={80}
                    value={form.proficiency_label}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        proficiency_label: event.target.value,
                      })
                    }
                    placeholder="e.g. Intermediate"
                    className={inputClass}
                  />
                </div>

                {/* Skill Icon Selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Skill Icon
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#e9eaf0] p-4 shadow-[inset_4px_4px_8px_#c8c9ce,inset_-4px_-4px_8px_#ffffff]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9eaf0] text-blue-600 shadow-[4px_4px_8px_#c8c9ce,-4px_-4px_8px_#ffffff]">
                      <SelectedSkillIcon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {SKILL_ICONS.find((item) => item.name === form.icon)
                          ?.label ?? "Code"}
                      </p>
                      <p className="text-xs text-slate-500">Selected icon</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(event) => setIconSearch(event.target.value)}
                    placeholder="Search icons..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  />

                  <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto rounded-2xl bg-[#e9eaf0] p-3 sm:grid-cols-4">
                    {filteredSkillIcons.map((item) => {
                      const Icon = item.Icon;
                      const selected = form.icon === item.name;

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              icon: item.name,
                            }))
                          }
                          title={item.label}
                          aria-label={`Select ${item.label} icon`}
                          className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition ${
                            selected
                              ? "bg-blue-50 text-blue-600 ring-2 ring-blue-400"
                              : "bg-white/70 text-slate-600 hover:bg-white"
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-medium">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}

                    {filteredSkillIcons.length === 0 && (
                      <p className="col-span-full py-4 text-center text-sm text-slate-500">
                        No icons found.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="skill-description">
                  Description
                </label>
                <textarea
                  id="skill-description"
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Briefly describe your experience with this skill..."
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/2000
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="skill-order">
                    Display order
                  </label>
                  <input
                    id="skill-order"
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

                <div className="flex items-center">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/60 p-4">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          is_published: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        Publish skill
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Show it on your portfolio
                      </span>
                    </span>
                  </label>
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
                    : editingSkill
                      ? "Save changes"
                      : "Create skill"}
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
            aria-labelledby="delete-skill-title"
            className="w-full max-w-md rounded-3xl bg-[#e9eaf0] p-7 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-skill-title" className="mt-5 text-xl font-bold">
              Delete this skill?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete{" "}
              <strong className="text-slate-700">{deleteTarget.name}</strong>.
              This action cannot be undone.
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
