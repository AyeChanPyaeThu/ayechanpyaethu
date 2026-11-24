import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Skill } from "@/lib/types/skill";

const SKILL_COLUMNS =
  "id, name, category, description, proficiency_label, sort_order, is_published, created_at, updated_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EDITABLE_FIELDS = [
  "name",
  "category",
  "description",
  "proficiency_label",
  "sort_order",
  "is_published",
] as const;

type EditableSkillField = (typeof EDITABLE_FIELDS)[number];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validateSkillFields(
  body: Record<string, unknown>,
  partial: boolean
): { valid: boolean; values: Partial<Record<EditableSkillField, unknown>> } {
  const values: Partial<Record<EditableSkillField, unknown>> = {};

  for (const key of Object.keys(body)) {
    if (
      key !== "id" &&
      !EDITABLE_FIELDS.includes(key as EditableSkillField)
    ) {
      return { valid: false, values };
    }
  }

  if (!partial || "name" in body) {
    if (
      typeof body.name !== "string" ||
      body.name.trim().length === 0 ||
      body.name.length > 120
    ) {
      return { valid: false, values };
    }
    values.name = body.name.trim();
  }

  if (!partial || "category" in body) {
    if (
      typeof body.category !== "string" ||
      body.category.trim().length === 0 ||
      body.category.length > 80
    ) {
      return { valid: false, values };
    }
    values.category = body.category.trim();
  }

  if ("description" in body) {
    if (
      body.description !== null &&
      (typeof body.description !== "string" ||
        body.description.length > 2000)
    ) {
      return { valid: false, values };
    }
    values.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  } else if (!partial) {
    values.description = null;
  }

  if ("proficiency_label" in body) {
    if (
      body.proficiency_label !== null &&
      (typeof body.proficiency_label !== "string" ||
        body.proficiency_label.length > 80)
    ) {
      return { valid: false, values };
    }
    values.proficiency_label =
      typeof body.proficiency_label === "string"
        ? body.proficiency_label.trim() || null
        : null;
  } else if (!partial) {
    values.proficiency_label = null;
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

  if ("is_published" in body) {
    if (typeof body.is_published !== "boolean") {
      return { valid: false, values };
    }
    values.is_published = body.is_published;
  } else if (!partial) {
    values.is_published = false;
  }

  return { valid: true, values };
}

/** Retrieve all skills for the authenticated administrator. */
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("skills")
    .select(SKILL_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to retrieve skills:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve skills." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    skills: (data ?? []) as Skill[],
  });
}

/** Create a skill. New skills are unpublished unless explicitly published. */
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
      { success: false, error: "A valid skill object is required." },
      { status: 400 }
    );
  }

  const validation = validateSkillFields(body, false);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Provide a valid name and category. Optional fields must also contain valid values.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("skills")
    .insert(validation.values)
    .select(SKILL_COLUMNS)
    .single();

  if (error) {
    console.error("Unable to create skill:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create skill." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Skill created successfully.",
      skill: data as Skill,
    },
    { status: 201 }
  );
}

/** Update skill details or publication status. */
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
      { success: false, error: "A valid skill ID is required." },
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

  const validation = validateSkillFields(updates, true);

  if (!validation.valid || Object.keys(validation.values).length === 0) {
    return NextResponse.json(
      { success: false, error: "One or more skill fields are invalid." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("skills")
    .update(validation.values)
    .eq("id", body.id)
    .select(SKILL_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Unable to update skill:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update skill." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Skill not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Skill updated successfully.",
    skill: data as Skill,
  });
}

/** Permanently delete one skill. */
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
      { success: false, error: "A valid skill ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("skills")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to delete skill:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete skill." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Skill not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    deletedId: data.id,
  });
}
