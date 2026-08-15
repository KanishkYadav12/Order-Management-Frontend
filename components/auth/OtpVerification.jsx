"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { verifyEmail, resendOtp } from "@/redux/actions/auth/authAction";
import { cn } from "@/lib/utils";

const LENGTH = 6;
const RESEND_COOLDOWN = 45;

/**
 * Email confirmation.
 *
 * Self-contained: it dispatches and reads its own results rather than sharing
 * the `verifyOTP` status slice with a sibling hook. `useVerifyEmail` and
 * `useResendOtp` both watched that same status, so a successful *resend*
 * triggered the verify hook's success branch — showing "Email verified
 * successfully" and redirecting the user away mid-flow.
 *
 * @param {object} props
 * @param {string} props.email
 * @param {Function} [props.onVerified] Defaults to sending the user to sign in.
 * @param {Function} [props.onBack]
 */
export default function OtpVerification({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const inputsRef = useRef([]);
  const dispatch = useDispatch();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = useCallback(
    async (code) => {
      setVerifying(true);
      setError("");

      const result = await dispatch(verifyEmail({ email, otp: code }));
      setVerifying(false);

      if (result.ok) {
        toast({
          title: "Email confirmed",
          description: "You can sign in now.",
        });
        if (onVerified) onVerified();
        else router.push("/login");
        return;
      }

      setError("That code isn't right. Check it and try again.");
      setDigits(Array(LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    },
    [dispatch, email, onVerified, router, toast]
  );

  const setDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < LENGTH - 1) inputsRef.current[index + 1]?.focus();

    // Submit as soon as the last box is filled — nobody wants to reach for a
    // button after typing a code they just read off their phone.
    const code = next.join("");
    if (code.length === LENGTH && !next.includes("")) submit(code);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /** Pasting the whole code is how most people actually enter one. */
  const handlePaste = (event) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const next = Array(LENGTH).fill("");
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);

    if (pasted.length === LENGTH) submit(pasted);
    else inputsRef.current[pasted.length]?.focus();
  };

  const handleResend = async () => {
    setResending(true);
    const result = await dispatch(resendOtp(email));
    setResending(false);

    if (result.ok) {
      setCooldown(RESEND_COOLDOWN);
      toast({
        title: "Code sent",
        description: `We've sent a new code to ${email}.`,
      });
    }
  };

  return (
    <div className="text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <MailCheck className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-xl font-bold tracking-tight">Check your email</h2>
      <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div
        className="mt-6 flex justify-center gap-2"
        onPaste={handlePaste}
        role="group"
        aria-label="Verification code"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={Boolean(error)}
            disabled={verifying}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            className={cn(
              "h-12 w-11 rounded-lg border bg-background text-center text-lg font-semibold tabular",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              "disabled:opacity-60",
              error && "border-destructive"
            )}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {verifying && (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Checking…
        </p>
      )}

      <div className="mt-6 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="text-muted-foreground"
        >
          {resending
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Didn't get it? Send again"}
        </Button>

        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-full gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
