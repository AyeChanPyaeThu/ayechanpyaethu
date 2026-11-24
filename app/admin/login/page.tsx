"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Unable to sign in. Check your email and password.");
        return;
      }

      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      // console.log("MFA factors:", factors);
      // console.log("MFA error:", factorsError);

      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactor = factors.totp.find(
        (factor) => factor.status === "verified",
      );

      if (!verifiedFactor) {
        await startTotpEnrollment();
        return;
      }

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: verifiedFactor.id,
        });

      if (challengeError) {
        throw challengeError;
      }

      setFactorId(verifiedFactor.id);
      setChallengeId(challenge.id);
      setStep("mfa");
    } catch {
      setErrorMessage("Unable to start MFA verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startTotpEnrollment() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Personal Portfolio Admin",
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: data.id,
        });

      if (challengeError) throw challengeError;

      setChallengeId(challenge.id);
      setStep("mfa");
    } catch {
      setErrorMessage(
        "Unable to start authenticator enrollment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim(),
      });

      if (error) {
        setErrorMessage("Invalid or expired code. Please try again.");
        return;
      }

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();

      if (claimsError || claimsData?.claims?.aal !== "aal2") {
        await supabase.auth.signOut();
        setErrorMessage(
          "MFA verification did not establish AAL2. Please try again.",
        );
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMessage("MFA verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-black/10 p-8 shadow-sm">
        <p className="mb-2 text-sm font-medium text-gray-500">Private area</p>

        <h1 className="text-2xl font-semibold">Administrator sign in</h1>

        <p className="mt-2 text-sm text-gray-600">
          {step === "password"
            ? "Sign in with your administrator account."
            : "Enter the six-digit code from Google Authenticator."}
        </p>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500"
              />
            </div>

            {errorMessage ? (
              <p role="alert" className="text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="mt-8 space-y-5">
            {qrCode ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">
                  Set up Google Authenticator
                </h2>

                <p className="text-sm text-gray-600">
                  Scan this QR code using Google Authenticator.
                </p>

                <img
                  src={qrCode}
                  alt="Authenticator enrollment QR code"
                  className="mx-auto h-48 w-48"
                />

                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium">
                    Can't scan the QR code?
                  </summary>
                  <p className="mt-2 break-all text-sm text-gray-600">
                    {totpSecret}
                  </p>
                </details>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold">Verify your identity</h2>
                <p className="text-sm text-gray-600">
                  Enter the current code from Google Authenticator.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="code" className="mb-2 block text-sm font-medium">
                Authentication code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="000000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-xl tracking-[0.4em] outline-none focus:border-gray-500"
              />
            </div>

            {errorMessage ? (
              <p role="alert" className="text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify and sign in"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
