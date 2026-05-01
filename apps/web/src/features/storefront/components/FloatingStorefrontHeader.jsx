import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { clearStoredUser } from "../../../lib/authStorage";
import { useScrollUpHeader } from "../../../lib/useScrollUpHeader";
import { useStoredUser } from "../../../lib/useStoredUser";
import { CartItemCountBadge } from "../../cart/components/CartItemCountBadge";
import { useCart } from "../../cart/hooks/useCart";
import { StorefrontLiveSearch } from "./StorefrontLiveSearch";
import { useCategories } from "../context/CategoriesContext";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "";
}

export function FloatingStorefrontHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStoredUser();
  const { categories } = useCategories();
  const sidebarItems = categories.filter((c) => c.is_visible_in_sidebar);
  const isVisible = useScrollUpHeader();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const { distinctItemCount } = useCart();
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
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 lg:flex-nowrap lg:justify-between lg:px-5">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4 lg:min-w-[18rem]">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 sm:h-12 sm:w-12 sm:rounded-2xl"
                aria-label="Open store menu"
                aria-expanded={menuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              {menuOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 min-w-[18rem] overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_24px_50px_rgba(7,17,31,0.18)] backdrop-blur-xl">
                  {sidebarItems.map((cat) => (
                    <Link
                      key={cat.category_id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <span>{cat.label}</span>
                      <ChevronRight className="h-4 w-4 text-brand-accent" />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link to="/" className="pointer-events-auto min-w-0 shrink-0">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="rounded-xl bg-[linear-gradient(135deg,#22d3ee,#2563eb)] px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-950 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm sm:tracking-[0.3em]">
                  SU
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">SUtore</p>
                  <p className="hidden text-xs uppercase tracking-[0.32em] text-cyan-200/70 sm:block">
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
                  className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10 sm:h-12 sm:gap-3 sm:rounded-2xl sm:px-4"
                  aria-label="Profile"
                  aria-expanded={profileMenuOpen}
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span className="hidden max-w-32 truncate text-sm font-medium text-white sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-cyan-200 transition-transform ${
                      profileMenuOpen ? "rotate-180" : ""
                    } hidden sm:block`}
                  />
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[13rem] overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_24px_50px_rgba(7,17,31,0.18)] backdrop-blur-xl">
                    <Link
                      to="/account/orders"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <ReceiptText className="h-4 w-4 text-brand-accent" />
                      Orders
                    </Link>
                    <Link
                      to="/account/wishlist"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <Heart className="h-4 w-4 text-brand-accent" />
                      Wishlist
                    </Link>
                    <Link
                      to="/account/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                    >
                      <Settings className="h-4 w-4 text-brand-accent" />
                      Account settings
                    </Link>
                    {user.role === "product_manager" ? (
                      <Link
                        to="/manager/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                      >
                        <ShieldCheck className="h-4 w-4 text-brand-accent" />
                        Manager dashboard
                      </Link>
                    ) : null}
                    {user.role === "sales_manager" || user.role === "admin" ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-brand-ink"
                      >
                        <ShieldCheck className="h-4 w-4 text-brand-accent" />
                        Admin dashboard
                      </Link>
                    ) : null}
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
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10 sm:h-12 sm:w-12 sm:rounded-2xl"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/cart"
              className="pointer-events-auto relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10 sm:h-12 sm:w-12 sm:rounded-2xl"
              aria-label="Cart"
            >
              <CartItemCountBadge count={distinctItemCount} className="absolute -right-1.5 -top-1.5" />
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
