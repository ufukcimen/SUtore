import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, Check, Circle, KeyRound } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { http } from "../../../lib/http";
import { AuthShell } from "../components/AuthShell";
import { AuthInput } from "../components/AuthInput";

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "uppercase", label: "At least 1 uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "At least 1 lowercase letter", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "At least 1 number", test: (value) => /\d/.test(value) },
  { id: "special", label: "At least 1 special character", test: (value) => /[^\w\s]/.test(value) },
  { id: "spaces", label: "No spaces", test: (value) => !/\s/.test(value) },
];

const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, special character, and no spaces.";

function evaluatePassword(value) {
  const checks = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(value) }));
  const passedCount = checks.filter((rule) => rule.passed).length;
  const isValid = passedCount === checks.length;

  return {
    checks,
    passedCount,
    isValid,
    label: !value ? "Start typing" : isValid ? "Very strong" : passedCount >= 4 ? "Almost there" : "Too weak",
    fillPercent: value ? Math.max((passedCount / checks.length) * 100, 18) : 0,
    fillClass: isValid ? "bg-emerald-500" : passedCount >= 4 ? "bg-cyan-500" : "bg-rose-400",
    textClass: isValid ? "text-emerald-700" : passedCount >= 4 ? "text-cyan-700" : "text-rose-700",
  };
}

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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [submitState, setSubmitState] = useState({ kind: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordState = useMemo(() => evaluatePassword(form.password), [form.password]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setSubmitState({ kind: "error", message: "Password reset link is invalid or has expired." });
      return;
    }

    if (!passwordState.isValid) {
      setSubmitState({ kind: "error", message: PASSWORD_ERROR_MESSAGE });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setSubmitState({ kind: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ kind: "idle", message: "" });

    try {
      const response = await http.post("/auth/reset-password", {
        token,
        password: form.password,
      });
      navigate("/login", {
        state: {
          signupMessage: response.data.message ?? "Password updated. You can sign in with your new password.",
        },
        replace: true,
      });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message: getErrorMessage(error, "We couldn't reset your password. Please request a new link."),
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
      eyebrow="New password"
      title="Choose a new password."
      description="Set a new password for your SUtore account."
      alternateLink={
        <p>
          Need another link?{" "}
          <Link className="font-semibold text-brand-accent" to="/forgot-password">
            Request password reset
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="reset-password-new"
          label="New password"
          type="password"
          placeholder="Create a strong password"
          value={form.password}
          onChange={handleChange("password")}
        />

        <AuthInput
          id="reset-password-confirm"
          label="Confirm password"
          type="password"
          placeholder="Repeat your new password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
        />

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                Password strength
              </p>
              <p className={`mt-1 text-sm font-semibold ${passwordState.textClass}`}>
                {passwordState.label}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {passwordState.passedCount}/{PASSWORD_RULES.length} rules met
            </span>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${passwordState.fillClass}`}
              style={{ width: `${passwordState.fillPercent}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {passwordState.checks.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                  rule.passed ? "bg-emerald-50 text-emerald-800" : "bg-white text-slate-500"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    rule.passed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {rule.passed ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
                </span>
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 bg-brand-ink text-white hover:bg-slate-900"
        >
          {isSubmitting ? "Saving password..." : "Reset password"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {submitState.message ? (
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${statusClassName}`}>
            {submitState.kind === "error" ? (
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{submitState.message}</p>
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}
