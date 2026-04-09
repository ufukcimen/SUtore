import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { http } from "../../../lib/http";
import { LaptopCard } from "./LaptopCard";

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
              <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm text-slate-700">
                <p className="font-semibold text-brand-ink">{products.length} products found</p>
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
                <p className="text-lg font-semibold text-brand-ink">{emptyLabel}</p>
                <p className="mt-2 text-sm text-slate-600">
                  The backend request completed successfully but returned no matching
                  products right now.
                </p>
              </div>
            )
          ) : null}
        </section>
      </div>
    </div>
  );
}
