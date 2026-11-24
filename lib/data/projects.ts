import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type {
  Project,
  ProjectImageRecord,
  ProjectRecord,
} from "@/lib/types/project";

const PROJECT_COLUMNS =
  "id, slug, title, summary, description, role, technologies, github_url, live_demo_url, cover_image_url, status, is_featured, sort_order, published_at, created_at, updated_at";

/**
 * Fetch published projects and their gallery images.
 * Supabase RLS remains the database-level security boundary.
 */
async function getProjects(featuredOnly: boolean): Promise<Project[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (featuredOnly) {
    query = query.eq("is_featured", true);
  }

  const { data: projectData, error: projectError } = await query;

  if (projectError) {
    console.error("Unable to fetch public projects:", projectError);
    return [];
  }

  const projectRows = (projectData ?? []) as unknown as ProjectRecord[];

  if (projectRows.length === 0) {
    return [];
  }

  const projectIds = projectRows.map((project) => project.id);

  const { data: imageData, error: imageError } = await supabase
    .from("project_images")
    .select("id, project_id, image_url, alt_text, sort_order, created_at")
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true });

  if (imageError) {
    console.error("Unable to fetch project images:", imageError);
  }

  const imageRows = (imageData ?? []) as unknown as ProjectImageRecord[];

  const imagesByProject = new Map<string, string[]>();

  for (const image of imageRows) {
    const currentImages = imagesByProject.get(image.project_id) ?? [];
    currentImages.push(image.image_url);
    imagesByProject.set(image.project_id, currentImages);
  }

  return projectRows.map((project) => ({
    id: project.id,
    name: project.title,
    note: project.summary,
    description: project.description,
    img: project.cover_image_url ?? "",
    images: imagesByProject.get(project.id) ?? [],
    githubUrl: project.github_url ?? undefined,
    liveUrl: project.live_demo_url ?? undefined,
    technologies: project.technologies ?? [],
    role: project.role,
  }));
}

/** Returns all published projects in display order. */
export function getPublicProjects(): Promise<Project[]> {
  return getProjects(false);
}

/** Returns only published projects marked as featured. */
export function getFeaturedProjects(): Promise<Project[]> {
  return getProjects(true);
}
