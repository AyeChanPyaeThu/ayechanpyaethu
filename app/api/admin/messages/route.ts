import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type {
  ContactMessageRecord,
  MessageStatus,
} from "@/lib/types/contact-message";

const MESSAGE_COLUMNS =
  "id, sender_name, sender_email, subject, message, status, created_at";

const MESSAGE_STATUSES: MessageStatus[] = ["unread", "read", "archived"];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMessageStatus(value: unknown): value is MessageStatus {
  return (
    typeof value === "string" &&
    MESSAGE_STATUSES.includes(value as MessageStatus)
  );
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** List the latest contact messages. Admin access is required. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Administrator access required." },
      { status: 403 }
    );
  }

  const requestedStatus = request.nextUrl.searchParams.get("status");

  if (
    requestedStatus &&
    requestedStatus !== "all" &&
    !isMessageStatus(requestedStatus)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid message status filter." },
      { status: 400 }
    );
  }

  let query = admin.supabase
    .from("contact_messages")
    .select(MESSAGE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (requestedStatus && requestedStatus !== "all") {
    query = query.eq("status", requestedStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to retrieve contact messages:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve messages." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    messages: (data ?? []) as unknown as ContactMessageRecord[],
  });
}

/** Update a message's status to unread, read, or archived. */
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

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    !("status" in body) ||
    !isUuid(body.id) ||
    !isMessageStatus(body.status)
  ) {
    return NextResponse.json(
      { success: false, error: "A valid message ID and status are required." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("contact_messages")
    .update({ status: body.status })
    .eq("id", body.id)
    .select(MESSAGE_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Unable to update contact message:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update message status." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Message not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: data as unknown as ContactMessageRecord,
  });
}

/** Permanently delete one contact message. Admin access is required. */
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

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    !isUuid(body.id)
  ) {
    return NextResponse.json(
      { success: false, error: "A valid message ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await admin.supabase
    .from("contact_messages")
    .delete()
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to delete contact message:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete message." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Message not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, deletedId: data.id });
}
