import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { clearStoredUser } from "../../../lib/authStorage";
import { useStoredUser } from "../../../lib/useStoredUser";
import { CartItemCountBadge } from "../../cart/components/CartItemCountBadge";
import { useCart } from "../../cart/hooks/useCart";
import { StorefrontLiveSearch } from "./StorefrontLiveSearch";
import { extraMenuItems } from "../data/storefrontContent";

const WELCOME_STORAGE_KEY = "sutoreWelcomeUser";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "";
}

export function StorefrontShell({ children, mainClassName = "" }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useStoredUser();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const profileMenuRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const { distinctItemCount } = useCart();
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    try {
      const storedWelcomeUser = sessionStorage.getItem(WELCOME_STORAGE_KEY);
      if (!storedWelcomeUser) {
        return;
      }

      const parsedUser = JSON.parse(storedWelcomeUser);
      const nextWelcomeName = getUserDisplayName(parsedUser);
      if (nextWelcomeName) {
        setWelcomeName(nextWelcomeName);
      }
    } catch {
      setWelcomeName("");
    } finally {
      sessionStorage.removeItem(WELCOME_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        window.clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  function handleLogout() {
    setProfileMenuOpen(false);
    setIsLoggingOut(true);

    logoutTimeoutRef.current = window.setTimeout(() => {
      clearStoredUser();
      setWelcomeName("");
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }, 700);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7fbff_0%,#ecfeff_45%,#fff8eb_100%)] text-slate-950">
      <div className="absolute inset-0 bg-grid bg-[size:28px_28px] opacity-25" />
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-brand-glow/30 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-gold/20 blur-3xl" />
      <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      {isLoggingOut ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[1.9rem] border border-white/60 bg-white/90 px-6 py-6 text-center shadow-[0_28px_80px_rgba(7,17,31,0.2)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cyan-400/20 text-brand-accent">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
              Signing out
            </p>
            <p className="mt-2 text-lg font-semibold text-brand-ink">
              Closing your session.
            </p>
          </div>
        </div>
      ) : null}

      {welcomeName ? (
        <div className="fixed inset-x-4 top-24 z-40 flex justify-start sm:inset-x-6 lg:top-28 lg:px-10">
          <div className="flex w-full max-w-sm items-start gap-4 rounded-[1.75rem] border border-cyan-200/70 bg-white/90 px-5 py-4 text-slate-900 shadow-[0_24px_60px_rgba(7,17,31,0.18)] backdrop-blur-xl">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/20 text-brand-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                Signed in
              </p>
              <p className="mt-1 text-base font-semibold text-brand-ink">
                Hello, {welcomeName}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeName("")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-300/50 hover:text-brand-ink"
              aria-label="Close welcome message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <header
        className={`relative z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl transition duration-500 ${
          isLoggingOut ? "scale-[0.99] opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-4 px-2 py-4 sm:px-4 lg:flex-nowrap lg:justify-between lg:px-5">
          <div className="flex shrink-0 items-center gap-4 lg:min-w-[18rem]">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Open store menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="shrink-0 min-w-fit">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#2563eb)] px-3 py-2 text-sm font-bold uppercase tracking-[0.3em] text-slate-950">
                  SU
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-white">SUtore</p>
                  <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
                    Electronics Store
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="order-3 w-full md:order-none md:flex-1 md:px-6 lg:mx-auto lg:max-w-3xl lg:min-w-0 lg:px-10">
            <StorefrontLiveSearch
              placeholder="Search laptops, monitors, GPUs, storage..."
              syncWithSearchPage
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:min-w-[8rem] lg:justify-end">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="inline-flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
                  aria-label="Profile"
                  aria-expanded={profileMenuOpen}
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span className="max-w-32 truncate text-sm font-medium text-white">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-cyan-200 transition-transform ${
                      profileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 min-w-[13rem] overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_24px_50px_rgba(7,17,31,0.18)] backdrop-blur-xl">
                    <Link
                      to="/account/orders"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <ReceiptText className="h-4 w-4 text-brand-accent" />
                      Orders
                    </Link>
                    <Link
                      to="/account/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <Settings className="h-4 w-4 text-brand-accent" />
                      Account settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <LogOut className="h-4 w-4 text-brand-accent" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/cart"
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
              aria-label="Cart"
            >
              <CartItemCountBadge count={distinctItemCount} className="absolute -right-1.5 -top-1.5" />
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`relative z-10 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? "lg:pl-[24rem]" : "lg:pl-0"
        }`}
      >
        <div
          className={`pointer-events-none absolute left-0 top-0 z-30 hidden h-full w-full max-w-sm transition-opacity duration-300 lg:block ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`pointer-events-auto h-full min-h-[calc(100vh-5.5rem)] w-full border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(13,27,42,0.98),rgba(8,17,31,0.98))] px-6 py-6 text-white shadow-2xl shadow-cyan-950/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
                  Store Menu
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">More departments</h2>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close store menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 space-y-3">
              {extraMenuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.route}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-left text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-cyan-200" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <main
          className={`mx-auto max-w-7xl px-4 py-8 transition duration-500 sm:px-6 lg:px-10 lg:py-10 xl:pl-14 xl:pr-8 ${
            isLoggingOut ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
          } ${mainClassName}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
