"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
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
      await createClient().auth.signOut();
      setStep("password");
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
      await createClient().auth.signOut();
      setStep("password");
      setFactorId("");
      setChallengeId("");
      setQrCode("");
      setTotpSecret("");
      setCode("");
      setErrorMessage(
        "Unable to start authenticator enrollment. Please sign in again.",
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
        await supabase.auth.signOut();
        setStep("password");
        setCode("");
        setErrorMessage("Invalid or expired code. Please sign in again.");
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
      await createClient().auth.signOut();
      setStep("password");
      setCode("");
      setErrorMessage("MFA verification failed. Please sign in again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#e3e4e9] px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-amber-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-orange-200/30 blur-3xl"
      />

      <section className="relative w-full max-w-[460px] rounded-[2rem] border border-white/70 bg-[#e3e4e9]/90 p-6 shadow-[12px_12px_28px_#c8c9ce,-12px_-12px_28px_#ffffff] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-900 text-amber-50 shadow-[4px_4px_10px_rgba(120,53,15,0.2)]">
            <ShieldCheck aria-hidden="true" size={25} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
              Secure access
            </p>
            <p className="mt-1 font-mon text-sm font-semibold text-slate-800">
              Aye Chan Pyae Thu
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <LockKeyhole aria-hidden="true" size={14} />
            {step === "password" ? "ADMINISTRATOR PORTAL" : "TWO-STEP VERIFICATION"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {step === "password" ? "Welcome back" : "Verify it’s you"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {step === "password"
              ? "Sign in with your administrator account to manage your portfolio."
              : "Enter the six-digit code from your authenticator app to continue."}
          </p>
        </div>

        <div className="mb-5 flex items-center gap-3" aria-label="Sign-in progress">
          <div className="h-1.5 flex-1 rounded-full bg-amber-800" />
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step === "mfa" ? "bg-amber-800" : "bg-slate-300"
            }`}
          />
          <span className="shrink-0 text-xs font-medium text-slate-500">
            {step === "password" ? "Step 1 of 2" : "Step 2 of 2"}
          </span>
        </div>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/80 bg-[#e3e4e9] px-4 py-3 text-sm text-slate-900 shadow-[inset_4px_4px_8px_#c8c9ce,inset_-4px_-4px_8px_#ffffff] outline-none transition placeholder:text-slate-400 focus:border-amber-700/40 focus:ring-4 focus:ring-amber-700/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
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
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/80 bg-[#e3e4e9] px-4 py-3 text-sm text-slate-900 shadow-[inset_4px_4px_8px_#c8c9ce,inset_-4px_-4px_8px_#ffffff] outline-none transition placeholder:text-slate-400 focus:border-amber-700/40 focus:ring-4 focus:ring-amber-700/10"
              />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(120,53,15,0.2)] transition hover:-translate-y-0.5 hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Continue securely"}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            {qrCode ? (
              <div className="space-y-3 rounded-2xl border border-white/80 bg-white/50 p-4 text-center">
                <h2 className="text-base font-semibold text-slate-800">
                  Set up your authenticator
                </h2>
                <p className="text-sm leading-5 text-slate-600">
                  Scan this QR code using Google Authenticator.
                </p>
                <div className="mx-auto flex size-52 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                  <img
                    src={qrCode}
                    alt="Authenticator enrollment QR code"
                    className="size-full object-contain"
                  />
                </div>
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium text-amber-900 underline decoration-amber-900/30 underline-offset-4">
                    Can’t scan the QR code?
                  </summary>
                  <p className="mt-2 break-all rounded-lg bg-white/70 p-3 font-mono text-xs leading-5 text-slate-600">
                    {totpSecret}
                  </p>
                </details>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-900/10 bg-amber-50/70 p-4">
                <h2 className="text-base font-semibold text-slate-800">
                  Verify your identity
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Enter the current code from your authenticator app.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
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
                className="w-full rounded-xl border border-white/80 bg-[#e3e4e9] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 shadow-[inset_4px_4px_8px_#c8c9ce,inset_-4px_-4px_8px_#ffffff] outline-none transition placeholder:text-slate-400 focus:border-amber-700/40 focus:ring-4 focus:ring-amber-700/10"
              />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(120,53,15,0.2)] transition hover:-translate-y-0.5 hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify and sign in"}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-300/70 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-amber-900 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-800"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Back to portfolio
          </Link>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Protected area · Authorized administrators only
          </p>
        </div>
      </section>
    </main>
  );
}
