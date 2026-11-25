"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Book,
  BookOpen,
  Camera,
  Code,
  Palette,
  Music,
  Plane,
  Dumbbell,
  Leaf,
  Gamepad2,
  Coffee,
  Globe,
  Brain,
  Film,
  Mountain,
  Utensils,
  Bike,
  Flower2,
  Headphones,
  Guitar,
  GraduationCap,
  Microscope,
  FlaskConical,
  Telescope,
  Map,
  CookingPot,
  Trophy,
  Puzzle,
  NotebookPen,
  Paintbrush,
  MonitorPlay,
  Smartphone,
  Laptop,
  Bot,
  Cpu,
  SearchCode,
  BookOpenText,
  UserRoundGroup,
  Lightbulb,
  PencilSparkles,
  TvMinimalPlay,
  Sparkles,
  Plus,
  Heart,
  Loader2,
  Search,
  PencilLine,
  Trash2,
  X,
  EyeOff,
  Eye,
  ArrowUpDown,
} from "lucide-react";
import type { InterestRecord } from "@/lib/types/interest";

const interestIcons = [
  { name: "SearchCode", Icon: SearchCode },
  { name: "BookOpenText", Icon: BookOpenText },
  { name: "UserRoundGroup", Icon: UserRoundGroup },
  { name: "Lightbulb", Icon: Lightbulb },
  { name: "PencilSparkles", Icon: PencilSparkles },
  { name: "TvMinimalPlay", Icon: TvMinimalPlay },
  { name: "Sparkles", Icon: Sparkles },

  { name: "Book", Icon: Book },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Camera", Icon: Camera },
  { name: "Code", Icon: Code },
  { name: "Palette", Icon: Palette },
  { name: "Music", Icon: Music },
  { name: "Plane", Icon: Plane },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Leaf", Icon: Leaf },
  { name: "Gamepad2", Icon: Gamepad2 },
  { name: "Coffee", Icon: Coffee },
  { name: "Globe", Icon: Globe },
  { name: "Brain", Icon: Brain },
  { name: "Film", Icon: Film },
  { name: "Mountain", Icon: Mountain },
  { name: "Utensils", Icon: Utensils },
  { name: "Bike", Icon: Bike },
  { name: "Flower2", Icon: Flower2 },

  { name: "Headphones", Icon: Headphones },
  { name: "Guitar", Icon: Guitar },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Microscope", Icon: Microscope },
  { name: "FlaskConical", Icon: FlaskConical },
  { name: "Telescope", Icon: Telescope },
  { name: "Map", Icon: Map },
  { name: "CookingPot", Icon: CookingPot },
  { name: "Trophy", Icon: Trophy },
  { name: "Puzzle", Icon: Puzzle },

  { name: "NotebookPen", Icon: NotebookPen },
  { name: "Paintbrush", Icon: Paintbrush },
  { name: "MonitorPlay", Icon: MonitorPlay },
  { name: "Smartphone", Icon: Smartphone },
  { name: "Laptop", Icon: Laptop },
  { name: "Bot", Icon: Bot },
  { name: "Cpu", Icon: Cpu },
];

type InterestForm = {
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_published: boolean;
};

const emptyForm: InterestForm = {
  title: "",
  description: "",
  icon: "Heart",
  sort_order: 0,
  is_published: false,
};

export default function AdminInterests() {
  const [interests, setInterests] = useState<InterestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InterestForm>(emptyForm);
  const [error, setError] = useState("");
  const [iconSearch, setIconSearch] = useState("");

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/interests", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load interests.");
      }

      setInterests(result.interests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const filteredInterests = useMemo(() => {
    return interests.filter((interest) => {
      const matchesSearch =
        interest.title.toLowerCase().includes(search.toLowerCase()) ||
        interest.description.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "published" && interest.is_published) ||
        (filter === "draft" && !interest.is_published);

      return matchesSearch && matchesFilter;
    });
  }, [interests, search, filter]);

  const publishedCount = interests.filter(
    (interest) => interest.is_published,
  ).length;

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: interests.length,
    });
    setIconSearch("");
    setError("");
    setShowForm(true);
  };

  const openEditForm = (interest: InterestRecord) => {
    setEditingId(interest.id);
    setForm({
      title: interest.title,
      description: interest.description,
      icon: interest.icon || "Heart",
      sort_order: interest.sort_order,
      is_published: interest.is_published,
    });
    setIconSearch("");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/interests", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save interest.");
      }

      closeForm();
      await fetchInterests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this interest?",
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch("/api/admin/interests", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete interest.");
      }

      await fetchInterests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const togglePublish = async (interest: InterestRecord) => {
    setError("");

    try {
      const response = await fetch("/api/admin/interests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: interest.id,
          is_published: !interest.is_published,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update interest.");
      }

      await fetchInterests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const filteredIcons = interestIcons.filter((item) =>
    item.name.toLowerCase().includes(iconSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#e9eaf0] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#e9eaf0] p-3 shadow-[5px_5px_10px_#c5c6cc,-5px_-5px_10px_#ffffff]">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Interests</h1>
                <p className="text-sm text-slate-500">
                  Manage your personal interests and hobbies
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Interest
          </button>
        </div>

        {/* Error */}
        {error && !showForm && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#e9eaf0] p-5 shadow-[6px_6px_12px_#c5c6cc,-6px_-6px_12px_#ffffff]">
            <p className="text-sm text-slate-500">Total Interests</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {interests.length}
            </p>
          </div>

          <div className="rounded-2xl bg-[#e9eaf0] p-5 shadow-[6px_6px_12px_#c5c6cc,-6px_-6px_12px_#ffffff]">
            <p className="text-sm text-slate-500">Published</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-[#e9eaf0] p-5 shadow-[6px_6px_12px_#c5c6cc,-6px_-6px_12px_#ffffff]">
            <p className="text-sm text-slate-500">Drafts</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {interests.length - publishedCount}
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-4 rounded-2xl bg-[#e9eaf0] p-4 shadow-[6px_6px_12px_#c5c6cc,-6px_-6px_12px_#ffffff] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search interests..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "published", "draft"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  filter === item
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Interest list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading interests...
          </div>
        ) : filteredInterests.length === 0 ? (
          <div className="rounded-2xl bg-[#e9eaf0] px-6 py-16 text-center shadow-[6px_6px_12px_#c5c6cc,-6px_-6px_12px_#ffffff]">
            <Heart className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-700">
              No interests found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add an interest or try another search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredInterests.map((interest) => {
              const SelectedIcon =
                interestIcons.find((item) => item.name === interest.icon)
                  ?.Icon || Sparkles;

              return (
                <div
                  key={interest.id}
                  className="rounded-2xl bg-[#e9eaf0] p-5 shadow-[6px_6px_12px_#c5c6cc,-6px_-6px_12px_#ffffff]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-[#e9eaf0] p-3 shadow-[inset_3px_3px_6px_#c5c6cc,inset_-3px_-3px_6px_#ffffff]">
                        <SelectedIcon className="h-6 w-6 text-pink-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-800">
                          {interest.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Order: {interest.sort_order}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        interest.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {interest.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-500">
                    {interest.description || "No description provided."}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <button
                      onClick={() => togglePublish(interest)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-blue-600"
                    >
                      {interest.is_published ? (
                        <>
                          <EyeOff size={15} />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye size={15} />
                          Publish
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(interest)}
                        aria-label={`Edit ${interest.title}`}
                        className="rounded-lg bg-white p-2 text-blue-600 transition hover:bg-blue-50"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(interest.id)}
                        aria-label={`Delete ${interest.title}`}
                        className="rounded-lg bg-white p-2 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-[#e9eaf0] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Interest" : "Add Interest"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details for your interest.
                </p>
              </div>
              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Interest title *
                </label>
                <input
                  required
                  maxLength={100}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Reading, Drawing, Traveling"
                  className="w-full rounded-xl border border-slate-200 bg-white text-gray-700 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  maxLength={1000}
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe this interest..."
                  className="w-full resize-y rounded-xl text-gray-700 border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Choose an icon
                </label>

                <div className="mb-3 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={iconSearch}
                    onChange={(event) => setIconSearch(event.target.value)}
                    placeholder="Search icons..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div className="grid max-h-44 grid-cols-5 gap-2 overflow-y-auto rounded-xl bg-white p-3 sm:grid-cols-7">
                  {filteredIcons.map(({ name, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => setForm({ ...form, icon: name })}
                      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition ${
                        form.icon === name
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-[10px]">{name}</span>
                    </button>
                  ))}
                  {filteredIcons.length === 0 && (
                    <p className="col-span-full py-4 text-center text-xs text-slate-400">
                      No matching icons.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Display order
                </label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sort_order: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-4">
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
                  <span className="block text-sm font-medium text-slate-700">
                    Publish this interest
                  </span>
                  <span className="text-xs text-slate-400">
                    Published interests appear on your public portfolio.
                  </span>
                </span>
              </label>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Interest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
