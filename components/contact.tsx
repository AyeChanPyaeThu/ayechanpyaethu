"use client";

import { useState } from "react";
import { Mail, MapPin, PhoneCall, Send } from "lucide-react";
import { Button } from "./ui/button";
import React from "react";

export default function Contact() {
  const [form, setForm] = useState({
    message: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send feedback.");
      }

      setStatus("Thank you! Your feedback has been sent 💙");

      setForm({
        message: "",
      });
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full border-t-3 border-gray-300/50 py-6 px-4 sm:px-6 lg:px-10"
      id="contact"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 items-center w-full">
        {/* Left: Social media and contact */}
        <div className="flex flex-col gap-4 w-full justify-center items-start text-sm sm:text-base lg:text-lg text-black">
          {/* Discord */}
          <div className="flex items-center gap-3 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="size-7 sm:size-8 shrink-0 fill-amber-800"
            >
              <path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z" />
            </svg>
            <span className="break-all">ayechanpyaethu</span>
            <span className="text-amber-700 shrink-0">on Discord</span>
          </div>

          {/* Viber */}
          <div className="flex items-center gap-3 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="size-7 sm:size-8 shrink-0 fill-amber-800"
            >
              <path d="M508.3 113.9C495.6 102.2 444.2 64.9 329.6 64.4C329.6 64.4 194.5 56.3 128.7 116.7C92.1 153.3 79.2 207 77.8 273.5C76.4 340 74.7 464.6 194.8 498.4L194.9 498.4L194.8 550C194.8 550 194 570.9 207.8 575.1C224.4 580.3 234.2 564.4 250.1 547.3C258.8 537.9 270.8 524.1 279.9 513.6C362.1 520.5 425.2 504.7 432.4 502.4C449 497 542.9 485 558.1 360.4C573.9 231.8 550.5 150.6 508.3 113.9zM522.2 351C509.3 455 433.2 461.6 419.2 466.1C413.2 468 357.7 481.8 288 477.3C288 477.3 236 540 219.8 556.3C214.5 561.6 208.7 561.1 208.8 550.6C208.8 543.7 209.2 464.9 209.2 464.9L209.2 464.9C107.4 436.7 113.4 330.6 114.5 275.1C115.6 219.6 126.1 174.1 157.1 143.5C212.8 93 327.5 100.5 327.5 100.5C424.4 100.9 470.8 130.1 481.6 139.9C517.3 170.5 535.5 243.7 522.2 351zM383.2 270.2C383.6 278.8 370.7 279.4 370.3 270.8C369.2 248.8 358.9 238.1 337.7 236.9C329.1 236.4 329.9 223.5 338.4 224C366.3 225.5 381.8 241.5 383.2 270.2zM403.5 281.5C404.5 239.1 378 205.9 327.7 202.2C319.2 201.6 320.1 188.7 328.6 189.3C386.6 193.5 417.5 233.4 416.4 281.8C416.3 290.4 403.3 290 403.5 281.5zM450.5 294.9C450.6 303.5 437.6 303.6 437.6 295C437 213.5 382.7 169.1 316.8 168.6C308.3 168.5 308.3 155.7 316.8 155.7C390.5 156.2 449.8 207.1 450.5 294.9zM439.2 393L439.2 393.2C428.4 412.2 408.2 433.2 387.4 426.5L387.2 426.2C366.1 420.3 316.4 394.7 285 369.7C268.8 356.9 254 341.8 242.6 327.3C232.3 314.4 221.9 299.1 211.8 280.7C190.5 242.2 185.8 225 185.8 225C179.1 204.2 200 184 219.1 173.2L219.3 173.2C228.5 168.4 237.3 170 243.2 177.1C243.2 177.1 255.6 191.9 260.9 199.2C265.9 206 272.6 216.9 276.1 223C282.2 233.9 278.4 245 272.4 249.6L260.4 259.2C254.3 264.1 255.1 273.2 255.1 273.2C255.1 273.2 272.9 340.5 339.4 357.5C339.4 357.5 348.5 358.3 353.4 352.2L363 340.2C367.6 334.2 378.7 330.4 389.6 336.5C404.3 344.8 423 357.7 435.4 369.4C442.4 375.1 444 383.8 439.2 393z" />
            </svg>
            <span>+959965468651</span>
            <span className="text-amber-700 shrink-0">on Viber</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin className="shrink-0 text-amber-900" size={26} />
            <span>Mandalay, Myanmar</span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <PhoneCall className="shrink-0 text-amber-900" size={24} />
            <span>+959965468651</span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="shrink-0 text-amber-900" size={24} />
            <span className="break-all">ayechanpyaethu.it@gmail.com</span>
          </div>
        </div>

        {/* Right: Contact invitation */}
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-2 text-base sm:text-lg text-black w-full">
          <p>Lets Create</p>
          <p>Something Amazing Together!</p>

          <Button className="neumorphic-two btn-neu mt-3">
            Get In Touch <Send />
          </Button>
        </div>

        {/* Middle: Feedback form */}
        <div className="flex flex-col justify-center items-center gap-3 text-sm sm:text-base lg:text-lg text-black w-full">
          <p className="text-center">
            Really appreciate for feedback or messages!
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center w-full max-w-lg"
          >
            <textarea
              placeholder="Anything u want to say.."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={1000}
              className="border border-amber-950 rounded-md p-3 w-full mt-2 min-h-28 resize-y"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="neumorphic-two btn-neu mt-3"
            >
              {loading ? "Sending..." : "Send Message"} <Send />
            </Button>

            {status && (
              <p role="status" className="text-sm text-center mt-2">
                {status}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="w-full text-center text-sm sm:text-md mon-exbold mt-6 text-amber-900 font-semibold">
        © 2026 Aye Chan Pyae Thu
      </div>
    </div>
  );
}
