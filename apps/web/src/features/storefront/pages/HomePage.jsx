import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Heart,
  Laptop,
  LoaderCircle,
  LogOut,
  Menu,
  Monitor,
  ReceiptText,
  RefreshCw,
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
import { CategoryArtwork } from "../components/StorefrontArtwork";
import { StorefrontLiveSearch } from "../components/StorefrontLiveSearch";
import { ProductCard } from "../components/ProductCard";
import { RecommendationCarousel } from "../components/RecommendationCarousel";
import { useCategories } from "../context/CategoriesContext";
import { resolveIcon } from "../data/iconMap";
import { http } from "../../../lib/http";

const WELCOME_STORAGE_KEY = "sutoreWelcomeUser";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "";
}

export function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useStoredUser();
  const { categories } = useCategories();
  const sidebarItems = categories.filter((c) => c.is_visible_in_sidebar);
  const homepageCards = categories.filter((c) => c.is_visible_on_homepage);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const profileMenuRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const { distinctItemCount } = useCart();
  const displayName = getUserDisplayName(user);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);

  function fetchRecommendations() {
    setRecsLoading(true);
    http
      .get("/products/random", { params: { count: 6 } })
      .then((res) => setRecommendations(res.data))
      .catch(() => setRecommendations([]))
      .finally(() => setRecsLoading(false));
  }

  useEffect(() => {
    fetchRecommendations();
  }, []);

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
            <StorefrontLiveSearch placeholder="Search laptops, monitors, GPUs, storage..." />
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
              {sidebarItems.map((cat) => (
                <Link
                  key={cat.category_id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-left text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <span>{cat.label}</span>
                  <ChevronRight className="h-4 w-4 text-cyan-200" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <main
          className={`mx-auto max-w-7xl px-4 py-8 transition duration-500 sm:px-6 lg:px-10 lg:py-10 xl:pl-14 xl:pr-8 ${
            isLoggingOut ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <section>
          <div
            id="custom-pc-creator"
            className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.12)] backdrop-blur-xl sm:p-8"
          >
            <div className="mt-2 flex flex-wrap gap-3">
              <a
                href="#custom-pc-creator"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Custom PC Creator
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.75rem] border border-cyan-200/70 bg-[linear-gradient(180deg,rgba(217,249,247,0.95),rgba(240,249,255,0.9))] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                  Builder spotlight
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-brand-ink sm:text-4xl">
                  Build your own.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  Shape the system around your own performance target, visual style, and
                  budget. Start with the parts that matter and assemble a cleaner custom
                  rig path from the homepage.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Choose the CPU, GPU, cooling, and case you actually want",
                    "Tune for gaming, creator workloads, or balanced everyday power",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(13,27,42,0.98),rgba(8,17,31,0.98))] p-5">
                <div className="relative h-full min-h-[18rem] overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/75 p-5">
                  <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
                  <div className="absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-brand-gold/20 blur-3xl" />

                  <div className="relative mx-auto flex h-full max-w-sm flex-col justify-between">
                    <div className="rounded-[1.4rem] border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-cyan-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                          Custom loadout
                        </span>
                        <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                          Live concept
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
                        <div className="space-y-3">
                          <div className="h-3 rounded-full bg-cyan-300/80" />
                          <div className="h-3 w-5/6 rounded-full bg-slate-600" />
                          <div className="h-3 w-4/6 rounded-full bg-slate-700" />
                        </div>
                        <div className="grid h-20 w-20 place-items-center rounded-2xl border border-cyan-300/30 bg-slate-950">
                          <div className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/10">
                            <Cpu className="h-6 w-6 text-cyan-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mx-auto mt-6 grid w-[15rem] grid-cols-[1fr_0.8fr] gap-4">
                      <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4">
                        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.4rem] border border-cyan-300/30 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.22),transparent_35%),#0f172a]">
                          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-slate-950">
                            <Sparkles className="h-7 w-7 text-cyan-200" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 self-center">
                        <div className="h-9 rounded-xl border border-white/10 bg-slate-900/80" />
                        <div className="h-9 rounded-xl border border-white/10 bg-slate-900/65" />
                        <div className="h-9 rounded-xl border border-cyan-300/20 bg-cyan-400/10" />
                      </div>
                    </div>

                    <p className="mt-6 text-center text-sm font-medium uppercase tracking-[0.24em] text-cyan-100/85">
                      Pick parts. Tune power. Build your own.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </section>

          <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold uppercase tracking-[0.16em] text-brand-ink sm:text-4xl">
                Featured categories
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {homepageCards.map((cat) => {
              const Icon = resolveIcon(cat.icon);

              return (
                <Link
                  key={cat.category_id}
                  to={`/category/${cat.slug}`}
                  className="group block overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 p-4 shadow-[0_18px_40px_rgba(7,17,31,0.08)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_26px_48px_rgba(7,17,31,0.12)]"
                  aria-label={`Open ${cat.label} category`}
                >
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950/90">
                    <CategoryArtwork type={cat.name} />
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-brand-ink">{cat.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {cat.description || `Browse ${cat.label.toLowerCase()}.`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-brand-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent transition group-hover:text-brand-ink">
                    Explore category
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
          </section>

          <section className="mt-14">
            <div className="flex items-end justify-between gap-4 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-accent/80">
                  Picked for you
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                  Recommended
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRecommendations}
                disabled={recsLoading}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-accent shadow-sm backdrop-blur-sm transition hover:border-cyan-300/40 hover:bg-white hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${recsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {recsLoading ? (
              <div className="mt-8 flex justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-brand-accent" />
              </div>
            ) : recommendations.length > 0 ? (
              <RecommendationCarousel>
                {recommendations.map((product) => (
                  <div key={product.product_id} className="w-[21rem] shrink-0 py-3">
                    <ProductCard product={product} compact floating />
                  </div>
                ))}
              </RecommendationCarousel>
            ) : (
              <p className="mt-8 text-center text-sm text-slate-500">
                No recommendations available right now.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
