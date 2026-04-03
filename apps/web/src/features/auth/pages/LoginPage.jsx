import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { http } from "../../../lib/http";
import { AuthShell } from "../components/AuthShell";
import { AuthInput } from "../components/AuthInput";

const WELCOME_STORAGE_KEY = "sutoreWelcomeUser";

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

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const signupMessage = location.state?.signupMessage ?? "";
  const signupEmail = location.state?.signupEmail ?? "";
  const [form, setForm] = useState({
    email: signupEmail,
    password: "",
  });
  const [submitState, setSubmitState] = useState({
    kind: signupMessage ? "success" : "idle",
    message: signupMessage,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ kind: "idle", message: "" });

    try {
      const response = await http.post("/auth/login", form);
      localStorage.setItem("sutoreUser", JSON.stringify(response.data.user));
      sessionStorage.setItem(WELCOME_STORAGE_KEY, JSON.stringify(response.data.user));
      navigate("/");
    } catch (error) {
      setSubmitState({
        kind: "error",
        message: getErrorMessage(error, "We couldn't sign you in. Please try again."),
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
      eyebrow="Account access"
      title="Welcome back."
      description="Sign in to track orders, manage saved items, and complete checkout faster from your SUtore account."
      alternateLink={
        <p>
          New to SUtore?{" "}
          <Link className="font-semibold text-brand-accent" to="/signup">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="login-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange("email")}
        />

        <AuthInput
          id="login-password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          hint="Use the password associated with your SUtore account."
          value={form.password}
          onChange={handleChange("password")}
        />

        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-accent" />
            Keep me signed in on this device
          </label>
          <button type="button" className="text-left font-semibold text-brand-accent">
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 bg-brand-ink text-white hover:bg-slate-900"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {submitState.message ? (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${statusClassName}`}
          >
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{submitState.message}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Secure sign-in gives you access to orders, saved products, and account details.</p>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
