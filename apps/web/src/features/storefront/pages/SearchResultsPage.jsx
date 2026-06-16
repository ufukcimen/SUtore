import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCcw, Search } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { EmptyState, PageHeader } from "../components/RetailPrimitives";
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
        <PageHeader
          eyebrow="Search results"
          icon={Search}
          title={activeQuery ? `Results for "${activeQuery}"` : "Search the live catalog."}
          compact
          description={
            !isLoading && !errorMessage && activeQuery
              ? `${products.length} matching products found.`
              : "Search by product name, model, specs, or description."
          }
          actions={
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to store
            </Link>
          }
        />

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <StorefrontSearchForm
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSubmit={handleSubmit}
            placeholder="Search by name, model, or description..."
            className="w-full"
            variant="light"
          />
        </div>

        <section className="mt-5">
          {!activeQuery ? (
            <EmptyState
              icon={Search}
              title="Start your search above."
              description="Enter a product name, model, or description to search the live catalog."
            />
          ) : null}

          {activeQuery && isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
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
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-sm">
              <p className="text-lg font-semibold">We could not load search results.</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {activeQuery && !isLoading && !errorMessage ? (
            products.length > 0 ? (
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id ?? product.product_id ?? product.name}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No results found."
                description={`We could not find any products matching "${activeQuery}" in the name, model, or description fields.`}
              />
            )
          ) : null}
        </section>
    </StorefrontShell>
  );
}
