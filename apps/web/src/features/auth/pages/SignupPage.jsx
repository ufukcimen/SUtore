import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { AuthShell } from "../components/AuthShell";
import { AuthInput } from "../components/AuthInput";

export function SignupPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Build your shopper profile."
      description="Start with a sleek onboarding experience that can later expand into addresses, order history, and wishlist management."
      alternateLink={
        <p>
          Already have an account?{" "}
          <Link className="font-semibold text-brand-accent" to="/login">
            Log in here
          </Link>
        </p>
      }
    >
      <form className="space-y-5">
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
          hint="Design note: this can later pair with password strength and confirmation rules."
          value={form.password}
          onChange={handleChange("password")}
        />

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
          type="button"
          className="w-full gap-2 bg-brand-accent text-brand-ink hover:bg-brand-glow"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The page is intentionally frontend-only. Your teammate can later connect the
            same fields to PostgreSQL-backed signup flows in FastAPI.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}

