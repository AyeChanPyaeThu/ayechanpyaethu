
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Basic validation
    if (
      
      typeof message !== "string" ||
      
      !message.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Please fill in all fields." },
        { status: 400 }
      );
    }

    if (
     
      message.length > 3000
    ) {
      return NextResponse.json(
        { success: false, error: "Your feedback is too long." },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error("Telegram environment variables are missing.");
    }

    const telegramMessage = [
      "📩 NEW PORTFOLIO FEEDBACK",
      "",
     
      "💬 Feedback:",
      message.trim(),
      "",
      "🌐 Sent from your portfolio website."
    ].join("\n");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      console.error("Telegram API error:", telegramData);

      return NextResponse.json(
        { success: false, error: "Could not send feedback." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feedback sent successfully!",
    });

  } catch (error) {
    console.error("Feedback API error:", error);

    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
