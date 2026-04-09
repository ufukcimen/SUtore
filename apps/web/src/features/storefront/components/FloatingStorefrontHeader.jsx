import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { clearStoredUser } from "../../../lib/authStorage";
import { useScrollUpHeader } from "../../../lib/useScrollUpHeader";
import { useStoredUser } from "../../../lib/useStoredUser";
import { extraMenuItems } from "../data/storefrontContent";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "";
}

export function FloatingStorefrontHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStoredUser();
  const isVisible = useScrollUpHeader();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen && !profileMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      const clickedOutsideProfile =
        profileMenuRef.current && !profileMenuRef.current.contains(event.target);

      if (menuOpen && clickedOutsideMenu) {
        setMenuOpen(false);
      }

      if (profileMenuOpen && clickedOutsideProfile) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, profileMenuOpen]);

  function handleLogout() {
    setProfileMenuOpen(false);
    clearStoredUser();
    navigate("/", { replace: true });
  }

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <header className="border-b border-white/10 bg-slate-950/85 shadow-[0_18px_45px_rgba(7,17,31,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-4 px-2 py-3 sm:px-4 lg:flex-nowrap lg:justify-between lg:px-5">
          <div className="flex shrink-0 items-center gap-4 lg:min-w-[18rem]">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="pointer-events-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Open store menu"
                aria-expanded={menuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              {menuOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 min-w-[18rem] overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_24px_50px_rgba(7,17,31,0.18)] backdrop-blur-xl">
                  {extraMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.route}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-brand-accent" />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link to="/" className="shrink-0 min-w-fit pointer-events-auto">
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
            <label className="flex h-14 items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 text-slate-300 shadow-lg shadow-cyan-950/20">
              <Search className="h-5 w-5 text-cyan-200" />
              <input
                type="search"
                placeholder="Search laptops, monitors, GPUs, storage..."
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:min-w-[8rem] lg:justify-end">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="pointer-events-auto inline-flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
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
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[13rem] overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_24px_50px_rgba(7,17,31,0.18)] backdrop-blur-xl">
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
                className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/cart"
              className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
