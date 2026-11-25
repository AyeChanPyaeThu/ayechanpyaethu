import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectImageRecord, ProjectRecord } from "@/lib/types/project";

const PROJECT_COLUMNS =
  "id, slug, title, summary, description, role, technologies, github_url, live_demo_url, cover_image_url, status, is_featured, sort_order, published_at, created_at, updated_at";

const IMAGE_COLUMNS =
  "id, project_id, image_url, alt_text, sort_order, created_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EDITABLE_FIELDS = [
  "slug",
  "title",
  "summary",
  "description",
  "role",
  "technologies",
  "github_url",
  "live_demo_url",
  "cover_image_url",
  "status",
  "is_featured",
  "sort_order",
  "images",
] as const;

type EditableProjectField = (typeof EDITABLE_FIELDS)[number];

type ProjectImageInput = {
  image_url: string;
  alt_text: string;
  sort_order: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNullableText(
  value: unknown,
  maxLength: number
): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && value.length <= maxLength)
  );
}

function isValidUrlOrPath(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed || /[\u0000-\u001F\\]/.test(trimmed)) {
    return false;
  }

  // Validate local paths.
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) {
      return false;
    }

    let pathname = trimmed.split(/[?#]/, 1)[0];

    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      return false;
    }

    const segments = pathname.split("/");

    return !segments.some(
      (segment) => segment === "." || segment === ".."
    );
  }

  // Validate external URLs.
  try {
    const url = new URL(trimmed);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function validateImages(value: unknown): ProjectImageInput[] | null {
    if (!Array.isArray(value) || value.length > 3) return null;
  const images: ProjectImageInput[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];

    if (!isPlainObject(item)) return null;

    const imageUrl = item.image_url;
    const altText = item.alt_text ?? "";
    const sortOrder = item.sort_order ?? index;

    if (
      typeof imageUrl !== "string" ||
      imageUrl.trim().length === 0 ||
      imageUrl.length > 2048 ||
      !isValidUrlOrPath(imageUrl) ||
      typeof altText !== "string" ||
      altText.length > 300 ||
      !Number.isInteger(sortOrder) ||
      (sortOrder as number) < 0 ||
      (sortOrder as number) > 100000
    ) {
      return null;
    }

    images.push({
      image_url: imageUrl.trim(),
      alt_text: altText.trim(),
      sort_order: sortOrder as number,
    });
  }

  return images;
}

function validateProjectFields(
  body: Record<string, unknown>,
  partial: boolean
): {
  valid: boolean;
  values: Partial<Record<EditableProjectField, unknown>>;
  images?: ProjectImageInput[];
} {
  const values: Partial<Record<EditableProjectField, unknown>> = {};

  for (const key of Object.keys(body)) {
    if (!EDITABLE_FIELDS.includes(key as EditableProjectField)) {
      return { valid: false, values };
    }
  }

  if (!partial || "slug" in body) {
    if (
      typeof body.slug !== "string" ||
      body.slug.trim().length === 0 ||
      body.slug.length > 120 ||
      !SLUG_PATTERN.test(body.slug.trim())
    ) {
      return { valid: false, values };
    }
    values.slug = body.slug.trim();
  }

  if (!partial || "title" in body) {
    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0 ||
      body.title.length > 160
    ) {
      return { valid: false, values };
    }
    values.title = body.title.trim();
  }

  const textFields = [
    ["summary", 500],
    ["description", 10000],
    ["role", 200],
  ] as const;

 for (const [field, maxLength] of textFields) {
  if (field in body) {
    if (field === "role" && body[field] === null) {
      values[field] = null;
      continue;
    }

    if (
      typeof body[field] !== "string" ||
      body[field].length > maxLength
    ) {
      return { valid: false, values };
    }

    values[field] = (body[field] as string).trim();
  } else if (!partial && field !== "role") {
    values[field] = "";
  } else if (!partial && field === "role") {
    values[field] = null;
  }
}

  if ("technologies" in body) {
    if (
      !Array.isArray(body.technologies) ||
      body.technologies.length > 30 ||
      !body.technologies.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.length <= 80
      )
    ) {
      return { valid: false, values };
    }
    values.technologies = body.technologies.map((item) =>
      (item as string).trim()
    );
  } else if (!partial) {
    values.technologies = [];
  }

  for (const field of [
    "github_url",
    "live_demo_url",
    "cover_image_url",
  ] as const) {
    if (field in body) {
      const value = body[field];
      if (
        !isNullableText(value, 2048) ||
        (typeof value === "string" &&
          value.trim().length > 0 &&
          !isValidUrlOrPath(value))
      ) {
        return { valid: false, values };
      }
      values[field] =
        typeof value === "string" ? value.trim() || null : null;
    } else if (!partial) {
      values[field] = null;
    }
  }

  if ("status" in body) {
    if (
      body.status !== "draft" &&
      body.status !== "published" &&
      body.status !== "archived"
    ) {
      return { valid: false, values };
    }
    values.status = body.status;
  } else if (!partial) {
    values.status = "draft";
  }

  if ("is_featured" in body) {
    if (typeof body.is_featured !== "boolean") {
      return { valid: false, values };
    }
    values.is_featured = body.is_featured;
  } else if (!partial) {
    values.is_featured = false;
  }

  if ("sort_order" in body) {
    if (
      !Number.isInteger(body.sort_order) ||
      (body.sort_order as number) < 0 ||
      (body.sort_order as number) > 100000
    ) {
      return { valid: false, values };
    }
    values.sort_order = body.sort_order;
  } else if (!partial) {
    values.sort_order = 0;
  }

    let images: ProjectImageInput[] | undefined;
  if ("images" in body) {
    images = validateImages(body.images) ?? undefined;
    if (!images) return { valid: false, values };
  }

  

  return { valid: true, values, images };
}

async function attachProjectImages(
  supabase: SupabaseClient,
  projects: ProjectRecord[]
) {
  const projectIds = projects.map((project) => project.id);
  if (projectIds.length === 0) return [];

  const { data, error } = await supabase
    .from("project_images")
    .select(IMAGE_COLUMNS)
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const imagesByProject = new Map<string, ProjectImageRecord[]>();
  for (const image of (data ?? []) as unknown as ProjectImageRecord[]) {
    const current = imagesByProject.get(image.project_id) ?? [];
    current.push(image);
    imagesByProject.set(image.project_id, current);
  }

  return projects.map((project) => ({
    ...project,
    images: imagesByProject.get(project.id) ?? [],
  }));
}

async function removeProjectStorageImages(
  projectId: string,
  imageUrls: string[],
) {
  const storageAdmin = createAdminClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    console.error("Supabase URL is missing; image cleanup skipped.");
    return;
  }

  const baseUrl = new URL(supabaseUrl);

  const expectedPrefix =
    `${baseUrl.pathname.replace(/\/$/, "")}` +
    `/storage/v1/object/public/portfolio-media/projects/${projectId}/`;

  const paths = [
    ...new Set(
      imageUrls.flatMap((imageUrl) => {
        try {
          const parsedUrl = new URL(imageUrl);

          if (
            parsedUrl.origin !== baseUrl.origin ||
            !parsedUrl.pathname.startsWith(expectedPrefix)
          ) {
            return [];
          }

          const filename = decodeURIComponent(
            parsedUrl.pathname.slice(expectedPrefix.length),
          );

          if (
            !filename ||
            filename.includes("/") ||
            filename === "." ||
            filename === ".." ||
            /[\\\u0000-\u001F]/.test(filename)
          ) {
            return [];
          }

          return [`projects/${projectId}/${filename}`];
        } catch {
          return [];
        }
      }),
    ),
  ];

  if (paths.length === 0 ) return;

  const { data, error } = await storageAdmin.storage
  .from("portfolio-media")
  .remove(paths);

if (error) {
  console.error("Unable to remove old project images:", error);
}
}

/** Retrieve all projects, including drafts and archived records, with galleries. */
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to retrieve projects:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve projects." },
      { status: 500 }
    );
  }

  try {
    const projects = await attachProjectImages(
      admin.supabase,
      (data ?? []) as unknown as ProjectRecord[]
    );

    return NextResponse.json({ success: true, projects });
  } catch (imageError) {
    console.error("Unable to retrieve project images:", imageError);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve project images." },
      { status: 500 }
    );
  }
}

/** Create a project and optionally add its gallery images. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!isPlainObject(body)) {
    return NextResponse.json(
      { success: false, error: "A valid project object is required." },
      { status: 400 }
    );
  }

  const validation = validateProjectFields(body, false);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: "One or more project fields are invalid." },
      { status: 400 }
    );
  }

  const insertValues = { ...validation.values } as Record<string, unknown>;
  if (insertValues.status === "published") {
    insertValues.published_at = new Date().toISOString();
  }

  const { data: project, error } = await admin.supabase
    .from("projects")
    .insert(insertValues)
    .select(PROJECT_COLUMNS)
    .single();

  if (error || !project) {
    console.error("Unable to create project:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create project. Check that its slug is unique." },
      { status: 500 }
    );
  }

  const projectRecord = project as unknown as ProjectRecord;

  if (validation.images && validation.images.length > 0) {
    const { error: imageError } = await admin.supabase
      .from("project_images")
      .insert(
        validation.images.map((image) => ({
          ...image,
          project_id: projectRecord.id,
        }))
      );

    if (imageError) {
      await admin.supabase.from("projects").delete().eq("id", projectRecord.id);
      console.error("Unable to create project gallery:", imageError);
      return NextResponse.json(
        { success: false, error: "Unable to save project gallery; project creation was rolled back." },
        { status: 500 }
      );
    }
  }

  const projectsWithImages = await attachProjectImages(
    admin.supabase,
    [projectRecord]
  );

  return NextResponse.json(
    {
      success: true,
      message: "Project created successfully.",
      project: projectsWithImages[0],
    },
    { status: 201 }
  );
}

/** Update project details and optionally replace its gallery. */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!isPlainObject(body) || !isUuid(body.id)) {
    return NextResponse.json(
      { success: false, error: "A valid project ID is required." },
      { status: 400 }
    );
  }

  const updates = { ...body };
  delete updates.id;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: "At least one field to update is required." },
      { status: 400 }
    );
  }

  const validation = validateProjectFields(updates, true);
  if (
    !validation.valid ||
    (Object.keys(validation.values).length === 0 && validation.images === undefined)
  ) {
    return NextResponse.json(
      { success: false, error: "One or more project fields are invalid." },
      { status: 400 }
    );
  }

    // Check the existing project and gallery before applying updates.
  const { data: existingProject, error: existingProjectError } =
    await admin.supabase
      .from("projects")
      .select("id, cover_image_url")
      .eq("id", body.id)
      .maybeSingle();

  if (existingProjectError) {
    console.error("Unable to check existing project:", existingProjectError);
    return NextResponse.json(
      { success: false, error: "Unable to validate the existing project." },
      { status: 500 }
    );
  }

  if (!existingProject) {
    return NextResponse.json(
      { success: false, error: "Project not found." },
      { status: 404 }
    );
  }

  const { data: existingImages, error: existingImagesError } =
    await admin.supabase
      .from("project_images")
      .select("id, image_url")
      .eq("project_id", body.id);

  if (existingImagesError) {
    console.error("Unable to check existing project images:", existingImagesError);
    return NextResponse.json(
      { success: false, error: "Unable to validate existing project images." },
      { status: 500 }
    );
  }

  const oldImageUrls = [
  existingProject.cover_image_url,
  ...(existingImages ?? []).map((image) => image.image_url),
].filter(
  (url): url is string => typeof url === "string" && url.length > 0,
);

  const effectiveCoverImage =
    "cover_image_url" in validation.values
      ? validation.values.cover_image_url
      : existingProject.cover_image_url;

  const effectiveGalleryCount =
    validation.images !== undefined
      ? validation.images.length
      : (existingImages ?? []).length;

  const hasCoverImage =
    typeof effectiveCoverImage === "string" &&
    effectiveCoverImage.trim().length > 0;

  if (effectiveGalleryCount + (hasCoverImage ? 1 : 0) > 3) {
    return NextResponse.json(
      {
        success: false,
        error: "A project can have a maximum of 3 images, including its cover image.",
      },
      { status: 400 }
    );
  }

  let updatedProject: ProjectRecord | null = null;

  if (Object.keys(validation.values).length > 0) {
    const updateValues = { ...validation.values } as Record<string, unknown>;
    if (updateValues.status === "published") {
      updateValues.published_at = new Date().toISOString();
    }

    const { data, error } = await admin.supabase
      .from("projects")
      .update(updateValues)
      .eq("id", body.id)
      .select(PROJECT_COLUMNS)
      .maybeSingle();

    if (error) {
      console.error("Unable to update project:", error);
      return NextResponse.json(
        { success: false, error: "Unable to update project. Check that its slug is unique." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    updatedProject = data as unknown as ProjectRecord;
  } else {
    const { data, error } = await admin.supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", body.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    updatedProject = data as unknown as ProjectRecord;
  }

  if (validation.images !== undefined) {
    const { data: newImages, error: insertError } =
      validation.images.length > 0
        ? await admin.supabase
            .from("project_images")
            .insert(
              validation.images.map((image) => ({
                ...image,
                project_id: body.id,
              }))
            )
            .select("id")
        : { data: [], error: null };

    if (insertError) {
      console.error("Unable to add replacement project images:", insertError);
      return NextResponse.json(
        { success: false, error: "Unable to save replacement project images." },
        { status: 500 }
      );
    }

    const { error: deleteError } = await admin.supabase
      .from("project_images")
      .delete()
      .eq("project_id", body.id)
      .not(
        "id",
        "in",
        `(${(newImages ?? []).map((image) => image.id).join(",") || "00000000-0000-0000-0000-000000000000"})`
      );

    if (deleteError) {
      console.error("Unable to remove previous project images:", deleteError);
      return NextResponse.json(
        { success: false, error: "New images were saved, but previous images could not be replaced. Please retry." },
        { status: 500 }
      );
    }
  }

  const result = await attachProjectImages(admin.supabase, [updatedProject]);

const currentImageUrls = [
  result[0]?.cover_image_url,
  ...(result[0]?.images ?? []).map((image) => image.image_url),
].filter(
  (url): url is string => typeof url === "string" && url.length > 0,
);

const unusedImageUrls = oldImageUrls.filter(
  (url) => !currentImageUrls.includes(url),
);

await removeProjectStorageImages(
  body.id,
  unusedImageUrls,
);

return NextResponse.json({
    success: true,
    message: "Project updated successfully.",
    project: result[0],
  });
}

/** Permanently delete a project; its gallery rows cascade-delete in the database. */
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!isPlainObject(body) || !isUuid(body.id)) {
    return NextResponse.json(
      { success: false, error: "A valid project ID is required." },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await admin.supabase
    .from("projects")
    .select("id, cover_image_url")
    .eq("id", body.id)
    .maybeSingle();

  if (projectError) {
    console.error("Unable to retrieve project:", projectError);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve project." },
      { status: 500 }
    );
  }

  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found." },
      { status: 404 }
    );
  }

  const { data: galleryImages, error: imagesError } =
    await admin.supabase
      .from("project_images")
      .select("image_url")
      .eq("project_id", body.id);

  if (imagesError) {
    console.error("Unable to retrieve project images:", imagesError);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve project images." },
      { status: 500 }
    );
  }

  const imageUrls = [
    project.cover_image_url,
    ...(galleryImages ?? []).map((image) => image.image_url),
  ].filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  const { data, error } = await admin.supabase
    .from("projects")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to delete project:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete project." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Project not found." },
      { status: 404 }
    );
  }

  await removeProjectStorageImages(
    body.id,
    imageUrls,
  );

  return NextResponse.json({
    success: true,
    deletedId: data.id,
  });
}