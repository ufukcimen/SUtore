import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CheckCircle2,
  LoaderCircle,
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

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
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
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState("");
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationActionId, setNotificationActionId] = useState(null);
  const [isMarkingAllNotifications, setIsMarkingAllNotifications] = useState(false);

  useEffect(() => {
    setDraftName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([]);
      setNotificationsError("");
      setIsLoadingNotifications(false);
      return;
    }

    let isActive = true;

    async function loadNotifications() {
      setIsLoadingNotifications(true);
      setNotificationsError("");
      try {
        const response = await http.get("/notifications", {
          params: { user_id: user.user_id },
        });
        if (isActive) {
          setNotifications(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (isActive) {
          setNotifications([]);
          setNotificationsError(getErrorMessage(error, "Unable to load notifications."));
        }
      } finally {
        if (isActive) {
          setIsLoadingNotifications(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isActive = false;
    };
  }, [user?.user_id]);

  if (!user) {
    return (
      <StorefrontPageShell
        description="Sign in to review your shopper details, rename the profile, or manage account actions."
        eyebrow="Account settings"
        title="You need to be signed in to access account settings."
      >
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm leading-7 text-slate-600">
            This page is reserved for signed-in shoppers. Return to the storefront or log
            in to manage account details.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-cyan-300/60 hover:text-slate-950"
            >
              Back to home
            </Link>
          </div>
        </section>
      </StorefrontPageShell>
    );
  }

  const displayName = getUserDisplayName(user);
  const unreadNotificationCount = notifications.filter((notification) => !notification.is_read).length;

  async function handleMarkNotificationRead(notificationId) {
    setNotificationActionId(notificationId);
    setNotificationsError("");
    try {
      const response = await http.patch(`/notifications/${notificationId}/read`, null, {
        params: { user_id: user.user_id },
      });
      setNotifications((current) => current.map((notification) => (
        notification.notification_id === notificationId ? response.data : notification
      )));
    } catch (error) {
      setNotificationsError(getErrorMessage(error, "Unable to update this notification."));
    } finally {
      setNotificationActionId(null);
    }
  }

  async function handleMarkAllNotificationsRead() {
    setIsMarkingAllNotifications(true);
    setNotificationsError("");
    try {
      await http.patch("/notifications/read-all", null, {
        params: { user_id: user.user_id },
      });
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        is_read: true,
      })));
    } catch (error) {
      setNotificationsError(getErrorMessage(error, "Unable to update notifications."));
    } finally {
      setIsMarkingAllNotifications(false);
    }
  }

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
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    Notifications
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Updates from sales and support
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {unreadNotificationCount > 0
                      ? `${unreadNotificationCount} unread account update${unreadNotificationCount === 1 ? "" : "s"}`
                      : "No unread account updates"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                disabled={notifications.length === 0 || unreadNotificationCount === 0 || isMarkingAllNotifications}
                onClick={handleMarkAllNotificationsRead}
                className="gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isMarkingAllNotifications ? "Updating..." : "Mark all read"}
              </Button>
            </div>

            {notificationsError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {notificationsError}
              </div>
            ) : null}

            {isLoadingNotifications ? (
              <div className="mt-6 flex items-center justify-center py-6 text-cyan-700">
                <LoaderCircle className="h-6 w-6 animate-spin text-cyan-700" />
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`rounded-lg border p-4 ${
                      notification.is_read
                        ? "border-slate-200 bg-slate-50/80"
                        : "border-cyan-200 bg-cyan-50/80"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                          {!notification.is_read ? (
                            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read ? (
                        <button
                          type="button"
                          disabled={notificationActionId === notification.notification_id}
                          onClick={() => handleMarkNotificationRead(notification.notification_id)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-slate-950 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {notificationActionId === notification.notification_id ? "Updating..." : "Mark read"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No notifications yet.
                  </p>
                ) : null}
              </div>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Profile overview
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
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

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
              Store access
            </p>
            <div className="mt-4 flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Account is active</h3>
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
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={handleProfileSubmit}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                <PencilLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Change username
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
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
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="Choose a storefront name"
              />
            </label>

            <Button
              type="submit"
              disabled={isSaving}
              className="mt-5 w-full gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-800"
            >
              {isSaving ? "Saving..." : "Save username"}
            </Button>

            {profileState.message ? (
              <div
                className={`mt-4 rounded-md border px-4 py-3 text-sm ${getStatusClassName(profileState.kind)}`}
              >
                {profileState.message}
              </div>
            ) : null}
          </form>

          <form
            className="rounded-lg border border-rose-200 bg-white p-6 shadow-sm"
            onSubmit={handleDeleteAccount}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-rose-100 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                  Delete account
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  Permanently remove this shopper account
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
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
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.14em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="Type DELETE"
              />
            </label>

            <Button
              type="submit"
              disabled={isDeleting}
              className="mt-5 w-full gap-2 rounded-md bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? "Deleting account..." : "Delete account"}
            </Button>

            {deleteState.message ? (
              <div
                className={`mt-4 rounded-md border px-4 py-3 text-sm ${getStatusClassName(deleteState.kind)}`}
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
