import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Mail,
  MapPin,
  PencilLine,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { clearStoredUser, writeStoredUser } from "../../../lib/authStorage";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "Account";
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

function getStatusClassName(kind) {
  if (kind === "error") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  if (kind === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  return "";
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/15 text-brand-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-brand-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const [draftName, setDraftName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [profileState, setProfileState] = useState({ kind: "idle", message: "" });
  const [deleteState, setDeleteState] = useState({ kind: "idle", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDraftName(user?.name ?? "");
  }, [user?.name]);

  if (!user) {
    return (
      <StorefrontPageShell
        description="Sign in to review your shopper details, rename the profile, or manage account actions."
        eyebrow="Account settings"
        title="You need to be signed in to access account settings."
      >
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center shadow-[0_20px_60px_rgba(7,17,31,0.08)]">
          <p className="text-sm leading-7 text-slate-600">
            This page is reserved for signed-in shoppers. Return to the storefront or log
            in to manage account details.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Sign in
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-cyan-300/60 hover:text-brand-ink"
            >
              Back to home
            </Link>
          </div>
        </section>
      </StorefrontPageShell>
    );
  }

  const displayName = getUserDisplayName(user);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    const nextName = draftName.trim();

    if (!nextName) {
      setProfileState({
        kind: "error",
        message: "Username can't be left blank.",
      });
      return;
    }

    setIsSaving(true);
    setProfileState({ kind: "idle", message: "" });

    try {
      const response = await http.patch(`/auth/users/${user.user_id}`, { name: nextName });
      const nextUser = response.data.user;
      writeStoredUser(nextUser);
      setDraftName(nextUser.name ?? "");
      setProfileState({
        kind: "success",
        message: response.data.message ?? "Account details updated.",
      });
    } catch (error) {
      setProfileState({
        kind: "error",
        message: getErrorMessage(error, "Unable to update the account name."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();

    if (deleteConfirmation !== "DELETE") {
      setDeleteState({
        kind: "error",
        message: "Type DELETE to confirm account removal.",
      });
      return;
    }

    setIsDeleting(true);
    setDeleteState({ kind: "idle", message: "" });

    try {
      await http.delete(`/auth/users/${user.user_id}`);
      clearStoredUser();
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteState({
        kind: "error",
        message: getErrorMessage(error, "Unable to delete the account right now."),
      });
      setIsDeleting(false);
    }
  }

  return (
    <StorefrontPageShell
      description="Review the shopper details stored on this account, update the visible profile name, or permanently remove the account."
      eyebrow="Account settings"
      title={`Manage ${displayName}`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="space-y-6">
          <article className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(7,17,31,0.08)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                  Profile overview
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-brand-ink">
                  Account details used across the storefront
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Signed in
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailCard icon={UserRound} label="Username" value={displayName} />
              <DetailCard icon={Mail} label="Email" value={user.email ?? "Not available"} />
              <DetailCard
                icon={BadgeCheck}
                label="Tax ID"
                value={user.tax_id?.trim() || "Not added yet"}
              />
              <DetailCard
                icon={MapPin}
                label="Home address"
                value={user.home_address?.trim() || "Not added yet"}
              />
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(7,17,31,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
              Store access
            </p>
            <div className="mt-4 flex flex-col gap-4 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-brand-accent">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-ink">Account is active</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    You can rename the profile shown in the storefront or remove the account
                    entirely from here.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                User ID {user.user_id}
              </span>
            </div>
          </article>
        </section>

        <section className="space-y-6">
          <form
            className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(7,17,31,0.08)]"
            onSubmit={handleProfileSubmit}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-brand-accent">
                <PencilLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                  Change username
                </p>
                <h2 className="mt-2 text-xl font-semibold text-brand-ink">
                  Update the shopper name shown in your account
                </h2>
              </div>
            </div>

            <label className="mt-6 flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-glow/20"
                placeholder="Choose a storefront name"
              />
            </label>

            <Button
              type="submit"
              disabled={isSaving}
              className="mt-5 w-full gap-2 bg-brand-ink text-white hover:bg-slate-900"
            >
              {isSaving ? "Saving..." : "Save username"}
            </Button>

            {profileState.message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getStatusClassName(profileState.kind)}`}
              >
                {profileState.message}
              </div>
            ) : null}
          </form>

          <form
            className="rounded-[2rem] border border-rose-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(7,17,31,0.08)]"
            onSubmit={handleDeleteAccount}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-700">
                  Delete account
                </p>
                <h2 className="mt-2 text-xl font-semibold text-brand-ink">
                  Permanently remove this shopper account
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This action removes the stored account record. Type <span className="font-semibold">DELETE</span> below to confirm.
                </p>
              </div>
            </div>

            <label className="mt-5 flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Confirmation text</span>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="Type DELETE"
              />
            </label>

            <Button
              type="submit"
              disabled={isDeleting}
              className="mt-5 w-full gap-2 bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? "Deleting account..." : "Delete account"}
            </Button>

            {deleteState.message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getStatusClassName(deleteState.kind)}`}
              >
                {deleteState.message}
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </StorefrontPageShell>
  );
}
