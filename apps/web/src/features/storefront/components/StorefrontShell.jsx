import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  LoaderCircle,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { clearStoredUser } from "../../../lib/authStorage";
import { useStoredUser } from "../../../lib/useStoredUser";
import { CartItemCountBadge } from "../../cart/components/CartItemCountBadge";
import { useCart } from "../../cart/hooks/useCart";
import { useCategories } from "../context/CategoriesContext";
import { getDisplayCategories } from "../data/categoryFallbacks";
import { StorefrontLiveSearch } from "./StorefrontLiveSearch";

const WELCOME_STORAGE_KEY = "sutoreWelcomeUser";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "";
}

function ProfileMenuLink({ to, onClick, icon: Icon, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
    >
      <Icon className="h-4 w-4 text-cyan-700" />
      {children}
    </Link>
  );
}

export function StorefrontShell({
  children,
  headerClassName = "",
  mainClassName = "",
  rootClassName = "",
}) {
  const navigate = useNavigate();
  const user = useStoredUser();
  const { categories } = useCategories();
  const sidebarItems = getDisplayCategories(categories).filter((c) => c.is_visible_in_sidebar);
  const { distinctItemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const profileMenuRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
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
    }, 500);
  }

  return (
    <div className={`min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6f2_52%,#f8fafc_100%)] text-slate-950 ${rootClassName}`}>
      {isLoggingOut ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-6 py-6 text-center shadow-xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">Signing out</p>
            <p className="mt-1 text-sm text-slate-500">Closing your session.</p>
          </div>
        </div>
      ) : null}

      {welcomeName ? (
        <div className="fixed right-4 top-20 z-[80] w-[calc(100%-2rem)] max-w-sm rounded-lg border border-cyan-200 bg-white p-4 shadow-lg sm:right-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Signed in
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">Hello, {welcomeName}.</p>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeName("")}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close welcome message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <header className={`sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 text-white shadow-[0_14px_36px_rgba(15,23,42,0.24)] backdrop-blur ${headerClassName}`}>
        <div className="mx-auto flex max-w-[90rem] min-w-0 flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:px-6">
          <div className="flex min-w-0 shrink-0 items-center gap-3 max-md:flex-1 lg:min-w-[18rem]">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-300 hover:bg-white/10 hover:text-cyan-200"
              aria-label="Open departments menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="min-w-0 shrink-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-400 text-sm font-black uppercase text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.18)]">
                  SU
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold tracking-tight text-white">
                    SUtore
                  </p>
                  <p className="hidden text-xs font-medium text-slate-400 sm:block">
                    Performance PC Retail
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="order-3 min-w-0 w-[calc(100vw-2rem)] md:order-none md:w-full md:flex-1 md:px-4 lg:px-8">
            <StorefrontLiveSearch
              placeholder="Search laptops, monitors, GPUs, storage..."
              syncWithSearchPage
              variant="light"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-slate-200 transition hover:border-cyan-300 hover:bg-white/10 hover:text-cyan-200"
                  aria-label="Profile"
                  aria-expanded={profileMenuOpen}
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span className="hidden max-w-36 truncate text-sm font-semibold sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`hidden h-4 w-4 shrink-0 transition-transform sm:block ${
                      profileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[14rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                    <ProfileMenuLink
                      to="/account/orders"
                      onClick={() => setProfileMenuOpen(false)}
                      icon={ReceiptText}
                    >
                      Orders
                    </ProfileMenuLink>
                    <ProfileMenuLink
                      to="/account/wishlist"
                      onClick={() => setProfileMenuOpen(false)}
                      icon={Heart}
                    >
                      Wishlist
                    </ProfileMenuLink>
                    <ProfileMenuLink
                      to="/account/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      icon={Settings}
                    >
                      Account settings
                    </ProfileMenuLink>
                    {user.role === "product_manager" ? (
                      <ProfileMenuLink
                        to="/manager/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        icon={ShieldCheck}
                      >
                        Product manager
                      </ProfileMenuLink>
                    ) : null}
                    {user.role === "sales_manager" || user.role === "admin" ? (
                      <ProfileMenuLink
                        to="/admin/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        icon={ShieldCheck}
                      >
                        Sales dashboard
                      </ProfileMenuLink>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      <LogOut className="h-4 w-4 text-cyan-700" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:bg-white/10 hover:text-cyan-200"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
            <Link
              to="/cart"
              className="relative inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-400 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              aria-label="Cart"
            >
              <CartItemCountBadge
                count={distinctItemCount}
                className="absolute -right-1.5 -top-1.5 !bg-white !text-slate-950 !shadow-sm"
              />
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>
      </header>

      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-sm transition-opacity ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-[80] h-dvh w-full max-w-sm transform-gpu border-r border-slate-200 bg-white shadow-2xl transition-transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Departments
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Shop by category</h2>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              aria-label="Close departments menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {sidebarItems.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/category/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <span>{cat.label}</span>
                <ChevronRight className="h-4 w-4 text-cyan-700" />
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <main
        className={`shopper-bottom-safe mx-auto w-full max-w-7xl px-4 py-6 transition duration-300 sm:px-6 lg:px-8 lg:py-8 ${
          isLoggingOut ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        } ${mainClassName}`}
      >
        {children}
      </main>
    </div>
  );
}
