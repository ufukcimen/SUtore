import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Cpu,
  Gauge,
  Monitor,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Zap,
} from "lucide-react";
import { http } from "../../../lib/http";
import { CategoryArtwork } from "../components/StorefrontArtwork";
import { ProductCard } from "../components/ProductCard";
import { StorefrontShell } from "../components/StorefrontShell";
import {
  EmptyState,
  ProductImageFrame,
  SectionHeader,
  StockBadge,
  TrustBadge,
} from "../components/RetailPrimitives";
import { useCategories } from "../context/CategoriesContext";
import { getHomepageCategories } from "../data/categoryFallbacks";
import { resolveIcon } from "../data/iconMap";
import {
  formatPrice,
  getEffectivePrice,
  getProductUrl,
  getStockQuantity,
} from "../utils/productPresentation";

const quickLinks = [
  { label: "Laptops", to: "/category/laptops", Icon: Monitor },
  { label: "PC Components", to: "/category/pc-components", Icon: Cpu },
  { label: "Monitors", to: "/category/monitors", Icon: Monitor },
  { label: "Storage", to: "/category/storage-devices", Icon: Zap },
];

export function HomePage() {
  const { categories } = useCategories();
  const homepageCards = getHomepageCategories(categories);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const heroProduct =
    recommendations.find((product) => (
      product?.image_url
      && !/demo/i.test(product?.name ?? "")
      && getStockQuantity(product) > 0
    ))
    ?? recommendations.find((product) => product?.image_url && getStockQuantity(product) > 0)
    ?? recommendations.find((product) => (
      !/demo/i.test(product?.name ?? "")
      && getStockQuantity(product) > 0
    ))
    ?? recommendations.find((product) => product?.image_url && !/demo/i.test(product?.name ?? ""))
    ?? recommendations.find((product) => product?.image_url)
    ?? recommendations.find((product) => !/demo/i.test(product?.name ?? ""))
    ?? recommendations[0]
    ?? null;

  function fetchRecommendations() {
    setRecsLoading(true);
    http
      .get("/products/random", { params: { count: 6 } })
      .then((res) => setRecommendations(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRecommendations([]))
      .finally(() => setRecsLoading(false));
  }

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <StorefrontShell mainClassName="max-w-[90rem]">
      <section className="sutore-home-hero relative w-full max-w-full overflow-hidden rounded-lg border border-slate-900 bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_46%,rgba(20,83,45,0.84)_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative grid min-w-0 gap-5 lg:min-h-[31rem] lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="sutore-home-hero-content min-w-0 max-w-4xl p-5 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
              <BadgeCheck className="h-4 w-4" />
              SUtore Performance Desk
            </div>
            <h1 className="mt-5 max-w-full break-words text-3xl font-semibold leading-tight text-white sm:max-w-3xl sm:text-5xl lg:text-6xl">
              Spec smarter. Build cleaner. Buy with confidence.
            </h1>
            <p className="mt-5 max-w-full break-words text-base leading-7 text-slate-300 sm:max-w-2xl sm:text-lg">
              A curated PC retail floor for shoppers who care about parts, compatibility, and clear purchase decisions.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/category/pc-components"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-cyan-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Shop components
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/custom-pc-creator"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.08] px-5 text-sm font-semibold text-white transition hover:border-cyan-300/70 hover:bg-white/[0.14]"
              >
                Open build studio
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid max-w-3xl grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
              {quickLinks.map(({ label, to, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex min-h-12 min-w-0 items-center justify-between rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/70 hover:bg-white/[0.14] hover:text-white"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 text-cyan-200" />
                    <span className="truncate">{label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>

            <div className="mt-7 hidden max-w-3xl gap-3 sm:grid sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-3">
                <p className="text-sm font-semibold text-white">Live catalog</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Prices, stock, and specs from the current backend.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-3">
                <p className="text-sm font-semibold text-white">Compare shortlist</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Keep up to four products side by side.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-3">
                <p className="text-sm font-semibold text-white">Builder ready</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Move selected parts into cart together.</p>
              </div>
            </div>
          </div>

          <div className="hidden items-end p-5 sm:p-8 lg:flex lg:p-10">
            {heroProduct ? (
              <Link
                to={getProductUrl(heroProduct)}
                className="w-full rounded-lg border border-white/15 bg-white/95 p-4 text-slate-950 shadow-[0_24px_60px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <ProductImageFrame
                  src={heroProduct.image_url}
                  alt={heroProduct.name}
                  className="aspect-[16/10] bg-white p-3"
                  imageClassName="drop-shadow-[0_14px_22px_rgba(15,23,42,0.14)]"
                />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Live inventory pick
                </p>
                <h2 className="mt-2 line-clamp-2 text-xl font-semibold leading-7">
                  {heroProduct.name}
                </h2>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatPrice(getEffectivePrice(heroProduct))}
                    </p>
                    <StockBadge product={heroProduct} className="mt-2" />
                  </div>
                  <span className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">
                    View
                  </span>
                </div>
              </Link>
            ) : recsLoading ? (
              <div className="w-full rounded-lg border border-white/15 bg-white/95 p-4 text-slate-950 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                <div className="aspect-[16/10] animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Live inventory pick
                </p>
                <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <span className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">
                    View
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-lg border border-white/15 bg-white/95 p-5 text-slate-950 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                <div className="grid aspect-[16/10] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center">
                  <div>
                    <PackageSearch className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Catalog ready
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Browse departments to see live inventory.
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Live inventory
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-7">
                  Real products, stock, and pricing from the backend.
                </h2>
                <Link
                  to="/category/pc-components"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
                >
                  Browse catalog
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid items-stretch gap-3 md:grid-cols-3">
          <TrustBadge icon={Truck} label="Fast shipping" detail="Clear shipping labels before checkout." />
          <TrustBadge icon={ShieldCheck} label="Warranty visibility" detail="Coverage shown on product pages." tone="green" />
          <TrustBadge icon={PackageSearch} label="Compare before buying" detail="Save up to four products for side-by-side review." />
        </div>

        <Link
          to="/custom-pc-creator"
          className="group rounded-lg border border-slate-200 bg-[#111827] p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                Build studio
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Custom PC Creator</h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-400 text-slate-950">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Choose CPU, GPU, memory, storage, cooling, case, and power with a live total.
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 text-slate-200">
              <Gauge className="h-4 w-4 text-cyan-300" />
              Compatibility-first workflow
            </span>
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>
      </section>

      <section className="mt-10">
        <SectionHeader
          eyebrow="Departments"
          title="Featured categories"
          description="Start from the category that matches your build or setup."
        />

        {homepageCards.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {homepageCards.map((cat) => {
              const Icon = resolveIcon(cat.icon);

              return (
                <Link
                  key={cat.category_id}
                  to={`/category/${cat.slug}`}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
                  aria-label={`Open ${cat.label} category`}
                >
                  <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-950">
                    <CategoryArtwork type={cat.name} />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950 group-hover:text-cyan-700">
                        {cat.label}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {cat.description || `Browse ${cat.label.toLowerCase()}.`}
                      </p>
                    </div>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Departments are unavailable."
            description="The storefront can still render, but categories could not be loaded from the backend."
          />
        )}
      </section>

      <section className="mt-10">
        <SectionHeader
          eyebrow="Recommended"
          title="Products to start with"
          description="A rotating sample from the live catalog."
          actions={
            <button
              type="button"
              onClick={fetchRecommendations}
              disabled={recsLoading}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${recsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          }
        />

        {recsLoading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((product) => (
              <ProductCard
                key={product.product_id ?? product.id ?? product.name}
                product={product}
                variant="compact"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No recommendations available."
            description="Recommendations will appear here when the backend catalog is available."
          />
        )}
      </section>
    </StorefrontShell>
  );
}
