import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BadgeCheck, Mail } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { http } from "../../../lib/http";
import { AuthShell } from "../components/AuthShell";
import { AuthInput } from "../components/AuthInput";

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item?.msg).filter(Boolean).join(" ");
  }
  return fallback;
}

export function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [submitState, setSubmitState] = useState({ kind: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ kind: "idle", message: "" });

    try {
      const response = await http.post("/auth/forgot-password", { email });
      setSubmitState({
        kind: "success",
        message: response.data.message ?? "If an account exists for that email, we sent a password reset link.",
      });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message: getErrorMessage(error, "We couldn't send a reset link. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClassName =
    submitState.kind === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-emerald-100 bg-emerald-50 text-emerald-900";

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Reset your password."
      description="Enter the email address for your SUtore account and we will send a secure reset link."
      alternateLink={
        <p>
          Remember your password?{" "}
          <Link className="font-semibold text-brand-accent" to="/login" state={{ from: location.state?.from }}>
            Back to sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="forgot-password-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 bg-brand-ink text-white hover:bg-slate-900"
        >
          {isSubmitting ? "Sending link..." : "Send reset link"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {submitState.message ? (
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${statusClassName}`}>
            {submitState.kind === "error" ? (
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{submitState.message}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <p>The link expires after a short time and can only be used once.</p>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
