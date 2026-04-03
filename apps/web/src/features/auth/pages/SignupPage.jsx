import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { http } from "../../../lib/http";
import { AuthShell } from "../components/AuthShell";
import { AuthInput } from "../components/AuthInput";

const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least 1 uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "At least 1 lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "At least 1 number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "At least 1 special character",
    test: (value) => /[^\w\s]/.test(value),
  },
  {
    id: "spaces",
    label: "No spaces",
    test: (value) => !/\s/.test(value),
  },
];

function evaluatePassword(value) {
  const checks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(value),
  }));
  const passedCount = checks.filter((rule) => rule.passed).length;
  const totalRules = checks.length;

  if (!value) {
    return {
      checks,
      passedCount,
      totalRules,
      isValid: false,
      label: "Start typing",
      fillClass: "bg-slate-300",
      textClass: "text-slate-500",
      chipClass: "border-slate-200 bg-slate-100 text-slate-500",
      fillPercent: 0,
    };
  }

  if (passedCount <= 2) {
    return {
      checks,
      passedCount,
      totalRules,
      isValid: false,
      label: "Weak",
      fillClass: "bg-rose-400",
      textClass: "text-rose-700",
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
      fillPercent: Math.max((passedCount / totalRules) * 100, 18),
    };
  }

  if (passedCount <= 4) {
    return {
      checks,
      passedCount,
      totalRules,
      isValid: false,
      label: "Fair",
      fillClass: "bg-amber-400",
      textClass: "text-amber-700",
      chipClass: "border-amber-200 bg-amber-50 text-amber-700",
      fillPercent: (passedCount / totalRules) * 100,
    };
  }

  if (passedCount === 5) {
    return {
      checks,
      passedCount,
      totalRules,
      isValid: false,
      label: "Strong",
      fillClass: "bg-cyan-500",
      textClass: "text-cyan-700",
      chipClass: "border-cyan-200 bg-cyan-50 text-cyan-700",
      fillPercent: (passedCount / totalRules) * 100,
    };
  }

  return {
    checks,
    passedCount,
    totalRules,
    isValid: true,
    label: "Very strong",
    fillClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    fillPercent: 100,
  };
}

const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, special character, and no spaces.";

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg ?? fallback;
  }
  return fallback;
}

export function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [submitState, setSubmitState] = useState({
    kind: "idle",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordState = evaluatePassword(form.password);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!passwordState.isValid) {
      setSubmitState({
        kind: "error",
        message: PASSWORD_ERROR_MESSAGE,
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ kind: "idle", message: "" });

    try {
      const response = await http.post("/auth/signup", {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
      });
      navigate("/login", {
        state: {
          signupMessage:
            response.data.message ??
            "Your account is ready. Sign in with the email and password you just created.",
          signupEmail: form.email,
        },
      });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message: getErrorMessage(error, "We couldn't create your account. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClassName =
    submitState.kind === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-amber-100 bg-amber-50 text-amber-900";

  return (
    <AuthShell
      eyebrow="Create account"
      title="Create your SUtore account."
      description="Set up your account to place orders, track deliveries, save products, and manage purchase details in one place."
      alternateLink={
        <p>
          Already have an account?{" "}
          <Link className="font-semibold text-brand-accent" to="/login">
            Log in here
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthInput
            id="signup-first-name"
            label="First name"
            placeholder="Onur"
            value={form.firstName}
            onChange={handleChange("firstName")}
          />

          <AuthInput
            id="signup-last-name"
            label="Last name"
            placeholder="Sönmez"
            value={form.lastName}
            onChange={handleChange("lastName")}
          />
        </div>

        <AuthInput
          id="signup-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange("email")}
        />

        <AuthInput
          id="signup-password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={form.password}
          onChange={handleChange("password")}
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
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${passwordState.chipClass}`}
            >
              {passwordState.passedCount}/{passwordState.totalRules} rules met
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
                  rule.passed
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-white text-slate-500"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    rule.passed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {rule.passed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 fill-current" />
                  )}
                </span>
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-accent" />
            <span>
              I agree to the terms, privacy policy, and account security practices for
              future purchases and invoices.
            </span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 bg-brand-accent text-brand-ink hover:bg-brand-glow"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {submitState.message ? (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${statusClassName}`}
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{submitState.message}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Create your account to start shopping, save products, and track every order from one dashboard.</p>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
