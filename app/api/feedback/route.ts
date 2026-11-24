import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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

    // Save the message first. The public insert policy and database constraints
    // provide a second validation layer; visitors cannot read submitted messages.
    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({ message });

    if (insertError) {
      console.error("Supabase contact message insert failed:", insertError);
      return NextResponse.json(
        { success: false, error: "Could not save your message. Please try again." },
        { status: 503 }
      );
    }

    // Telegram is an additional notification channel, not the message store.
    // A Telegram outage must not discard a message already saved in Supabase.
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
              ].join("\\n"),
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
      console.warn("Telegram notification skipped: environment variables are not configured.");
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been received. Thank you!",
    });
  } catch (error) {
    console.error("Contact message API error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
