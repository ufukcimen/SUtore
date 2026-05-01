import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, LoaderCircle, Trash2 } from "lucide-react";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";

function formatPrice(price) {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

function getStockClassName(quantity) {
  const stock = Number(quantity);

  if (!Number.isFinite(stock) || stock <= 0) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (stock <= 5) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getStockLabel(quantity) {
  const stock = Number(quantity);

  if (!Number.isFinite(stock) || stock <= 0) {
    return "Out of stock";
  }

  if (stock === 1) {
    return "1 unit remaining";
  }

  return `${stock} units remaining`;
}

export function WishlistPage() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/account/wishlist" }, replace: true });
      return;
    }

    let isActive = true;

    async function loadWishlist() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await http.get("/wishlist", {
          params: { user_id: user.user_id },
        });

        if (!isActive) {
          return;
        }

        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We could not load your wishlist right now.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      isActive = false;
    };
  }, [user, navigate]);

  async function handleRemove(productId) {
    if (!user) {
      return;
    }

    try {
      await http.delete("/wishlist", {
        params: { user_id: user.user_id, product_id: productId },
      });

      setItems((current) => current.filter((item) => item.product_id !== productId));
    } catch {
      // Silently handle — item stays in list on error.
    }
  }

  if (!user) {
    return null;
  }

  return (
    <StorefrontPageShell
      currentStep=""
      description="Products you saved for later. Click any item to view full details or add it to your cart."
      eyebrow="Wishlist"
      title="Your saved products."
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <p className="text-lg font-semibold">Could not load wishlist</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center shadow-[0_20px_60px_rgba(7,17,31,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-brand-ink">
            Your wishlist is empty.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
            Browse the store and save products you are interested in. They
            will appear here for easy access.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
          >
            Browse products
          </Link>
        </section>
      ) : null}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <div className="space-y-5">
          {items.map((item) => {
            const product = item.product;

            if (!product) {
              return null;
            }

            return (
              <article
                key={item.wishlist_item_id}
                className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(7,17,31,0.1)] sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <Link
                      to={`/products/${product.product_id}`}
                      className="block h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_48%,#fff7ed_100%)] shadow-sm"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0">
                      {product.category ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {product.category}
                        </span>
                      ) : null}
                      <Link to={`/products/${product.product_id}`}>
                        <h2 className="mt-2 break-words text-lg font-semibold text-brand-ink transition hover:text-brand-accent sm:text-xl">
                          {product.name}
                        </h2>
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStockClassName(product.stock_quantity)}`}
                        >
                          {getStockLabel(product.stock_quantity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
                    <p className="rounded-2xl bg-cyan-50 px-4 py-2 text-lg font-semibold text-brand-accent">
                      {formatPrice(product.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemove(product.product_id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </StorefrontPageShell>
  );
}
