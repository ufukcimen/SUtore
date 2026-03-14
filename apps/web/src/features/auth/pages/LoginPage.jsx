import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { AuthShell } from "../components/AuthShell";
import { AuthInput } from "../components/AuthInput";

export function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <AuthShell
      eyebrow="Account access"
      title="Welcome back to your setup."
      description="Access orders, saved builds, wishlisted products, and future checkout details from one secure place."
      alternateLink={
        <p>
          New to SUtore?{" "}
          <Link className="font-semibold text-brand-accent" to="/signup">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5">
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
          hint="Backend integration can later plug into this same form structure."
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
          type="button"
          className="w-full gap-2 bg-brand-ink text-white hover:bg-slate-900"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This page is visual-only for now. It is ready to connect to your FastAPI
            auth endpoints later without redesigning the layout.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}

