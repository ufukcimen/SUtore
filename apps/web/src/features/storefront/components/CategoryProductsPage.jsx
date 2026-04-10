import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Filter, RefreshCcw, X } from "lucide-react";
import { http } from "../../../lib/http";
import { LaptopCard } from "./LaptopCard";
import { StorefrontShell } from "./StorefrontShell";
import {
  CATEGORY_ITEM_TYPES,
  ITEM_TYPE_LABELS,
  PRICE_RANGES,
  parsePriceRange,
} from "../data/itemTypes";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
];

function sortProducts(products, sortValue) {
  if (sortValue === "default") {
    return products;
  }

  const sorted = [...products];

  if (sortValue === "price_asc") {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
    return sorted;
  }

  if (sortValue === "price_desc") {
    sorted.sort((a, b) => Number(b.price) - Number(a.price));
    return sorted;
  }

  if (sortValue === "popularity") {
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
    return sorted;
  }

  return products;
}

export function CategoryProductsPage({
  category,
  badgeLabel,
  heading,
  loadingLabel,
  errorLabel,
  emptyLabel,
  Icon,
}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sortValue, setSortValue] = useState("default");
  const [selectedItemType, setSelectedItemType] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");

  const itemTypeOptions = CATEGORY_ITEM_TYPES[category] ?? [];
  const hasFilters = itemTypeOptions.length > 0;
  const hasActiveFilters = selectedItemType !== "" || selectedPriceRange !== "";

  const sortedProducts = useMemo(
    () => sortProducts(products, sortValue),
    [products, sortValue],
  );

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = { category };

        if (selectedItemType) {
          params.item_type = selectedItemType;
        }

        const { min, max } = parsePriceRange(selectedPriceRange);
        if (min !== null) {
          params.price_min = min;
        }
        if (max !== null) {
          params.price_max = max;
        }

        const response = await http.get("/products", { params });

        if (!isActive) {
          return;
        }

        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const nextMessage =
          error instanceof Error
            ? error.message
            : "We could not load products right now.";

        setErrorMessage(nextMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [category, selectedItemType, selectedPriceRange]);

  function clearFilters() {
    setSelectedItemType("");
    setSelectedPriceRange("");
  }

  return (
    <StorefrontShell>
      <header className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.08)] backdrop-blur-xl sm:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300/50 hover:text-brand-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to main page
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-accent">
              <Icon className="h-4 w-4" />
              {badgeLabel}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-brand-ink">
              {heading}
            </h1>
          </div>

          {!isLoading && !errorMessage ? (
            <div className="flex items-center gap-3">
              <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm text-slate-700">
                <p className="font-semibold text-brand-ink">{products.length} products found</p>
              </div>
              <div className="relative">
                <select
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value)}
                  className="appearance-none rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 pr-10 text-sm font-semibold text-brand-ink shadow-sm transition hover:border-cyan-300/50 focus:border-cyan-300 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {hasFilters || true ? (
        <div className="mt-5 rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(7,17,31,0.06)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-brand-accent" />
            <p className="text-sm font-semibold text-brand-ink">Filters</p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-start gap-4">
            {hasFilters ? (
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {itemTypeOptions.map((type) => {
                    const isActive = selectedItemType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedItemType(isActive ? "" : type)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-cyan-300 bg-cyan-50 text-brand-accent"
                            : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-brand-ink"
                        }`}
                      >
                        {ITEM_TYPE_LABELS[type] ?? type}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className={hasFilters ? "ml-auto" : ""}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Price
              </p>
              <div className="relative">
                <select
                  value={selectedPriceRange}
                  onChange={(event) => setSelectedPriceRange(event.target.value)}
                  className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-1.5 pr-8 text-xs font-semibold text-brand-ink shadow-sm transition hover:border-cyan-300/50 focus:border-cyan-300 focus:outline-none"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-brand-accent">
              <RefreshCcw className="h-6 w-6 animate-spin" />
            </div>
            <p className="mt-4 text-lg font-semibold text-brand-ink">{loadingLabel}</p>
            <p className="mt-2 text-sm text-slate-600">
              Fetching products from the backend catalog.
            </p>
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
            <p className="text-lg font-semibold">{errorLabel}</p>
            <p className="mt-2 text-sm">{errorMessage}</p>
          </div>
        ) : null}

        {!isLoading && !errorMessage ? (
          sortedProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <LaptopCard
                  key={product.id ?? product.product_id ?? product.name}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold text-brand-ink">
                {hasActiveFilters ? "No products match your filters." : emptyLabel}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {hasActiveFilters
                  ? "Try adjusting your filters or clearing them to see all products."
                  : "The backend request completed successfully but returned no matching products right now."}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:border-cyan-300/50"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          )
        ) : null}
      </section>
    </StorefrontShell>
  );
}
