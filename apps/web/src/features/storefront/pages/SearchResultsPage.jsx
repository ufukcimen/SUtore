import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCcw, Search } from "lucide-react";
import { http } from "../../../lib/http";
import { LaptopCard } from "../components/LaptopCard";
import { StorefrontSearchForm } from "../components/StorefrontSearchForm";

function normalizeQuery(value) {
  return value.trim();
}

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = useMemo(
    () => normalizeQuery(searchParams.get("q") ?? ""),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSearchInput(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      if (!currentQuery) {
        setProducts([]);
        setErrorMessage("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await http.get("/products", {
          params: { search: currentQuery },
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
            : "We could not load search results right now.";

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
  }, [currentQuery]);

  function handleSubmit(event) {
    event.preventDefault();
    const nextQuery = normalizeQuery(searchInput);

    if (!nextQuery) {
      navigate("/search", { replace: false });
      return;
    }

    navigate(`/search?q=${encodeURIComponent(nextQuery)}`);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_45%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
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
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-brand-ink">
                {currentQuery ? `Results for "${currentQuery}"` : "Search the live catalog."}
              </h1>
              {!isLoading && !errorMessage && currentQuery ? (
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
          {!currentQuery ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold text-brand-ink">Start your search above.</p>
              <p className="mt-2 text-sm text-slate-600">
                Enter a product name, model, or description and press Enter to see results.
              </p>
            </div>
          ) : null}

          {currentQuery && isLoading ? (
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

          {currentQuery && !isLoading && errorMessage ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold">We could not load search results.</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {currentQuery && !isLoading && !errorMessage ? (
            products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <LaptopCard
                    key={product.id ?? product.product_id ?? product.name}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
                <p className="text-lg font-semibold text-brand-ink">No results found.</p>
                <p className="mt-2 text-sm text-slate-600">
                  We could not find any products matching "{currentQuery}" in the name,
                  model, or description fields.
                </p>
              </div>
            )
          ) : null}
        </section>
      </div>
    </div>
  );
}
