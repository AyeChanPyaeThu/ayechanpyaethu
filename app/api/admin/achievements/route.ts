import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AchievementRecord } from "@/lib/types/achievement";

const ACHIEVEMENT_COLUMNS =
  "id, title, issuer, description, achieved_on, credential_url, image_url, image_urls, status, sort_order, created_at, updated_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EDITABLE_FIELDS = [
  "title",
  "issuer",
  "description",
  "achieved_on",
  "credential_url",
  "image_url",
  "image_urls",
  "status",
  "sort_order",
] as const;

type EditableAchievementField = (typeof EDITABLE_FIELDS)[number];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidUrlOrPath(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed || /[\u0000-\u001F\\]/.test(trimmed)) {
    return false;
  }

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

    return !pathname.split("/").some(
      (segment) => segment === "." || segment === ".."
    );
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function removeAchievementStorageImages(
  achievementId: string,
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
    `/storage/v1/object/public/portfolio-media/achievements/${achievementId}/`;

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

          return [`achievements/${achievementId}/${filename}`];
        } catch {
          return [];
        }
      }),
    ),
  ];

  if (paths.length === 0) return;

  const { error } = await storageAdmin.storage
    .from("portfolio-media")
    .remove(paths);

  if (error) {
    console.error("Unable to remove old achievement images:", error);
  }
}

function validateAchievementFields(
  body: Record<string, unknown>,
  partial: boolean
): {
  valid: boolean;
  values: Partial<Record<EditableAchievementField, unknown>>;
} {
  const values: Partial<Record<EditableAchievementField, unknown>> = {};

  for (const key of Object.keys(body)) {
    if (!EDITABLE_FIELDS.includes(key as EditableAchievementField)) {
      return { valid: false, values };
    }
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

  for (const field of ["issuer", "description"] as const) {
    if (field in body) {
      const maxLength = field === "issuer" ? 160 : 3000;
      if (
        body[field] !== null &&
        (typeof body[field] !== "string" || body[field].length > maxLength)
      ) {
        return { valid: false, values };
      }
      values[field] =
        typeof body[field] === "string" ? body[field].trim() || null : null;
    } else if (!partial) {
      values[field] = null;
    }
  }

  if ("achieved_on" in body) {
    if (
      body.achieved_on !== null &&
      (typeof body.achieved_on !== "string" || !isValidDate(body.achieved_on))
    ) {
      return { valid: false, values };
    }
    values.achieved_on = body.achieved_on;
  } else if (!partial) {
    values.achieved_on = null;
  }

  for (const field of ["credential_url", "image_url"] as const) {
    if (field in body) {
      if (
        body[field] !== null &&
        (typeof body[field] !== "string" ||
          body[field].length > 2048 ||
          !isValidUrlOrPath(body[field]))
      ) {
        return { valid: false, values };
      }
      values[field] =
        typeof body[field] === "string" ? body[field].trim() || null : null;
    } else if (!partial) {
      values[field] = null;
    }
  }

    if ("image_urls" in body) {
      if (
        !Array.isArray(body.image_urls) ||
        body.image_urls.length > 30 ||
        !body.image_urls.every(
        (url) =>
          typeof url === "string" &&
          url.length <= 2048 &&
          isValidUrlOrPath(url)
      )
    ) {
      return { valid: false, values };
    }

    values.image_urls = body.image_urls.map((url) => url.trim());
  } else if (!partial) {
    values.image_urls = [];
  }

  if ("status" in body) {
    if (!["draft", "published", "archived"].includes(String(body.status))) {
      return { valid: false, values };
    }
    values.status = body.status;
  } else if (!partial) {
    values.status = "draft";
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

  return { valid: true, values };
}

/** Retrieve all achievements, including drafts and archived records. */
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("achievements")
    .select(ACHIEVEMENT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("achieved_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to retrieve achievements:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve achievements." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    achievements: (data ?? []) as AchievementRecord[],
  });
}

/** Create an achievement. New records are drafts unless explicitly published. */
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
      { success: false, error: "A valid achievement object is required." },
      { status: 400 }
    );
  }

  const validation = validateAchievementFields(body, false);
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Provide a valid title. Optional fields must also contain valid values.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("achievements")
    .insert(validation.values)
    .select(ACHIEVEMENT_COLUMNS)
    .single();

  if (error) {
    console.error("Unable to create achievement:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create achievement." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Achievement created successfully.",
      achievement: data as AchievementRecord,
    },
    { status: 201 }
  );
}

/** Update achievement details, images, or publication status. */
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
      { success: false, error: "A valid achievement ID is required." },
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

  const validation = validateAchievementFields(updates, true);
  if (!validation.valid || Object.keys(validation.values).length === 0) {
    return NextResponse.json(
      { success: false, error: "One or more achievement fields are invalid." },
      { status: 400 }
    );
  }

  const { data: existingAchievement, error: existingAchievementError } =
    await admin.supabase
      .from("achievements")
      .select("id, image_url, image_urls")
      .eq("id", body.id)
      .maybeSingle();

  if (existingAchievementError) {
    console.error("Unable to check existing achievement:", existingAchievementError);
    return NextResponse.json(
      { success: false, error: "Unable to validate the existing achievement." },
      { status: 500 }
    );
  }

  if (!existingAchievement) {
    return NextResponse.json(
      { success: false, error: "Achievement not found." },
      { status: 404 }
    );
  }

  const oldImageUrls = [
    existingAchievement.image_url,
    ...(existingAchievement.image_urls ?? []),
  ].filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  const { data, error } = await admin.supabase
    .from("achievements")
    .update(validation.values)
    .eq("id", body.id)
    .select(ACHIEVEMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Unable to update achievement:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update achievement." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Achievement not found." },
      { status: 404 }
    );
  }

  const currentImageUrls = [
    data.image_url,
    ...(data.image_urls ?? []),
  ].filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  const unusedImageUrls = oldImageUrls.filter(
    (url) => !currentImageUrls.includes(url)
  );

  await removeAchievementStorageImages(
    body.id,
    unusedImageUrls
  );

  return NextResponse.json({
    success: true,
    message: "Achievement updated successfully.",
    achievement: data as AchievementRecord,
  });
}

/** Permanently delete one achievement. */
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
      { success: false, error: "A valid achievement ID is required." },
      { status: 400 }
    );
  }

  const { data: achievement, error: achievementError } =
    await admin.supabase
      .from("achievements")
      .select("id, image_url, image_urls")
      .eq("id", body.id)
      .maybeSingle();

  if (achievementError) {
    console.error("Unable to retrieve achievement images:", achievementError);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve achievement images." },
      { status: 500 }
    );
  }

  if (!achievement) {
    return NextResponse.json(
      { success: false, error: "Achievement not found." },
      { status: 404 }
    );
  }

  const imageUrls = [
    achievement.image_url,
    ...(achievement.image_urls ?? []),
  ].filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  const { data, error } = await admin.supabase
    .from("achievements")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to delete achievement:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete achievement." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Achievement not found." },
      { status: 404 }
    );
  }

  await removeAchievementStorageImages(
    body.id,
    imageUrls
  );

  return NextResponse.json({
    success: true,
    deletedId: data.id,
  });
}
