import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { InterestRecord } from "@/lib/types/interest";

const INTEREST_COLUMNS =
  "id, title, description, icon, sort_order, is_published, created_at, updated_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EDITABLE_FIELDS = [
  "title",
  "description",
  "icon",
  "sort_order",
  "is_published",
] as const;

type EditableInterestField = (typeof EDITABLE_FIELDS)[number];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validateInterestFields(
  body: Record<string, unknown>,
  partial: boolean
): {
  valid: boolean;
  values: Partial<Record<EditableInterestField, unknown>>;
} {
  const values: Partial<Record<EditableInterestField, unknown>> = {};

  for (const key of Object.keys(body)) {
    if (!EDITABLE_FIELDS.includes(key as EditableInterestField)) {
      return { valid: false, values };
    }
  }

  if (!partial || "title" in body) {
    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0 ||
      body.title.length > 120
    ) {
      return { valid: false, values };
    }
    values.title = body.title.trim();
  }

  if ("description" in body) {
    if (
      typeof body.description !== "string" ||
      body.description.length > 2000
    ) {
      return { valid: false, values };
    }
    values.description = body.description.trim();
  } else if (!partial) {
    values.description = "";
  }

  if ("icon" in body) {
    if (
      body.icon !== null &&
      (typeof body.icon !== "string" || body.icon.length > 80)
    ) {
      return { valid: false, values };
    }
    values.icon =
      typeof body.icon === "string" ? body.icon.trim() || null : null;
  } else if (!partial) {
    values.icon = null;
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

/** Retrieve all interests for the authenticated administrator. */
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("interests")
    .select(INTEREST_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to retrieve interests:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve interests." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    interests: (data ?? []) as InterestRecord[],
  });
}

/** Create an interest. New interests are unpublished unless specified. */
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
      { success: false, error: "A valid interest object is required." },
      { status: 400 }
    );
  }

  const validation = validateInterestFields(body, false);
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
    .from("interests")
    .insert(validation.values)
    .select(INTEREST_COLUMNS)
    .single();

  if (error) {
    console.error("Unable to create interest:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create interest." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Interest created successfully.",
      interest: data as InterestRecord,
    },
    { status: 201 }
  );
}

/** Update interest details, icon, ordering, or publication status. */
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
      { success: false, error: "A valid interest ID is required." },
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

  const validation = validateInterestFields(updates, true);
  if (!validation.valid || Object.keys(validation.values).length === 0) {
    return NextResponse.json(
      { success: false, error: "One or more interest fields are invalid." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("interests")
    .update(validation.values)
    .eq("id", body.id)
    .select(INTEREST_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Unable to update interest:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update interest." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Interest not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Interest updated successfully.",
    interest: data as InterestRecord,
  });
}

/** Permanently delete one interest. */
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
      { success: false, error: "A valid interest ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("interests")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to delete interest:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete interest." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Interest not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    deletedId: data.id,
  });
}
