import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCcw, Search } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { StorefrontSearchForm } from "../components/StorefrontSearchForm";
import { StorefrontShell } from "../components/StorefrontShell";
import { normalizeSearchQuery, useProductSearch } from "../hooks/useProductSearch";

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = normalizeSearchQuery(searchParams.get("q") ?? "");
  const [searchInput, setSearchInput] = useState(currentQuery);
  const activeQuery = normalizeSearchQuery(searchInput);
  const { products, isLoading, errorMessage } = useProductSearch(searchInput);

  useEffect(() => {
    setSearchInput(currentQuery);
  }, [currentQuery]);

  function handleSubmit(event) {
    event.preventDefault();
    const nextQuery = normalizeSearchQuery(searchInput);

    if (!nextQuery) {
      navigate("/search", { replace: false });
      return;
    }

    navigate(`/search?q=${encodeURIComponent(nextQuery)}`);
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

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-accent">
                <Search className="h-4 w-4" />
                Search results
              </div>
              <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                {activeQuery ? `Results for "${activeQuery}"` : "Search the live catalog."}
              </h1>
              {!isLoading && !errorMessage && activeQuery ? (
                <p className="mt-4 text-sm text-slate-600">
                  {products.length} matching products found.
                </p>
              ) : null}
            </div>

            <StorefrontSearchForm
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onSubmit={handleSubmit}
              placeholder="Search by name, model, or description..."
              className="w-full"
              variant="light"
            />
          </div>
        </header>

        <section className="mt-8">
          {!activeQuery ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold text-brand-ink">Start your search above.</p>
              <p className="mt-2 text-sm text-slate-600">
                Enter a product name, model, or description to search the live catalog.
              </p>
            </div>
          ) : null}

          {activeQuery && isLoading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-brand-accent">
                <RefreshCcw className="h-6 w-6 animate-spin" />
              </div>
              <p className="mt-4 text-lg font-semibold text-brand-ink">Searching products...</p>
              <p className="mt-2 text-sm text-slate-600">
                Looking through names, models, and descriptions.
              </p>
            </div>
          ) : null}

          {activeQuery && !isLoading && errorMessage ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold">We could not load search results.</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {activeQuery && !isLoading && !errorMessage ? (
            products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id ?? product.product_id ?? product.name}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
                <p className="text-lg font-semibold text-brand-ink">No results found.</p>
                <p className="mt-2 text-sm text-slate-600">
                  We could not find any products matching "{activeQuery}" in the name,
                  model, or description fields.
                </p>
              </div>
            )
          ) : null}
        </section>
    </StorefrontShell>
  );
}
