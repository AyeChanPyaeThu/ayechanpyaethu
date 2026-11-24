
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

// In-memory rate limit storage for local development.
const requestCounts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ip);

  if (!current || now >= current.resetAt) {
    requestCounts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return false;
  }

  if (current.count >= RATE_LIMIT) {
    return true;
  }

  current.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Identify the visitor without storing their raw IP address.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error("Supabase server key is not configured.");
}

const visitorIp =
  request.headers.get("x-real-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

const keyHash = createHmac("sha256", serviceRoleKey)
  .update(visitorIp)
  .digest("hex");

const adminSupabase = createAdminClient();

const { data: rateLimitData, error: rateLimitError } =
  await adminSupabase.rpc("consume_feedback_rate_limit", {
    p_key_hash: keyHash,
    p_limit: 5,
    p_window_seconds: 600,
  });

if (rateLimitError) {
  console.error("Feedback rate limit check failed:", rateLimitError);

  return NextResponse.json(
    { success: false, error: "Unable to process your request. Please try again." },
    { status: 503 }
  );
}

const rateLimit = Array.isArray(rateLimitData)
  ? rateLimitData[0]
  : null;

if (!rateLimit) {
  return NextResponse.json(
    { success: false, error: "Unable to process your request. Please try again." },
    { status: 503 }
  );
}

if (!rateLimit.allowed) {
  return NextResponse.json(
    { success: false, error: "Too many messages. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retry_after_seconds),
      },
    }
  );
}
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many messages. Please try again in 10 minutes.",
        },
        { status: 429 }
      );
    }

    const body: unknown = await request.json();

    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (message.length > 3000) {
      return NextResponse.json(
        { success: false, error: "Your message is too long." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({ message });

    if (insertError) {
      console.error("Supabase contact message insert failed:", insertError);

      return NextResponse.json(
        {
          success: false,
          error: "Could not save your message. Please try again.",
        },
        { status: 503 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: [
                "📩 NEW PORTFOLIO MESSAGE",
                "",
                "💬 Message:",
                message,
                "",
                "🌐 Sent from your portfolio website.",
              ].join("\n"),
            }),
          }
        );

        const telegramData = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
          console.error("Telegram notification failed:", telegramData);
        }
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }
    } else {
      console.warn(
        "Telegram notification skipped: environment variables are not configured."
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been received. Thank you!",
    });
  } catch (error) {
    console.error("Contact message API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
