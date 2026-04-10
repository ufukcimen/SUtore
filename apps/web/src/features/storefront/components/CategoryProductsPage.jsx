import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, RefreshCcw } from "lucide-react";
import { http } from "../../../lib/http";
import { LaptopCard } from "./LaptopCard";
import { StorefrontShell } from "./StorefrontShell";

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
    // Placeholder: shuffle until real popularity data is available.
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
        const response = await http.get("/products", {
          params: { category },
        });

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
  }, [category]);

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
              <p className="text-lg font-semibold text-brand-ink">{emptyLabel}</p>
              <p className="mt-2 text-sm text-slate-600">
                The backend request completed successfully but returned no matching
                products right now.
              </p>
            </div>
          )
        ) : null}
      </section>
    </StorefrontShell>
  );
}
