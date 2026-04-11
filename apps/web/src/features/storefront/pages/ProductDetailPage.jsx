import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  Heart,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";
import { addProductToCart } from "../../cart/data/cartStorage";
import { StorefrontShell } from "../components/StorefrontShell";
import { ITEM_TYPE_LABELS } from "../data/itemTypes";

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

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const user = useStoredUser();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await http.get(`/products/${productId}`);

        if (!isActive) {
          return;
        }

        setProduct(response.data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("This product could not be found.");
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "We could not load this product right now.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!user || !productId) {
      setIsWishlisted(false);
      return;
    }

    let isActive = true;

    http
      .get("/wishlist/check", { params: { user_id: user.user_id, product_id: productId } })
      .then((response) => {
        if (isActive) {
          setIsWishlisted(response.data.wishlisted);
        }
      })
      .catch(() => {
        if (isActive) {
          setIsWishlisted(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, productId]);

  const stockQuantity = product ? Number(product.stock_quantity) : 0;
  const remainingStock = Number.isFinite(stockQuantity)
    ? Math.max(Math.floor(stockQuantity), 0)
    : 0;
  const isOutOfStock = !product || remainingStock <= 0;

  function getStockLabel() {
    if (isOutOfStock) {
      return "Out of stock";
    }

    if (remainingStock === 1) {
      return "1 unit remaining";
    }

    return `${remainingStock} units remaining`;
  }

  function getStockClassName() {
    if (isOutOfStock) {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }

    if (remainingStock <= 5) {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  function handleAddToCart() {
    if (isOutOfStock || !product) {
      return;
    }

    addProductToCart(product);
    setIsAdded(true);
  }

  async function handleToggleWishlist() {
    if (!user) {
      navigate("/login", { state: { from: `/products/${productId}` }, replace: true });
      return;
    }

    if (wishlistLoading) {
      return;
    }

    setWishlistLoading(true);

    try {
      if (isWishlisted) {
        await http.delete("/wishlist", {
          params: { user_id: user.user_id, product_id: productId },
        });
        setIsWishlisted(false);
      } else {
        await http.post("/wishlist", {
          user_id: user.user_id,
          product_id: Number(productId),
        });
        setIsWishlisted(true);
      }
    } catch {
      // Silently handle — the button state stays unchanged on error.
    } finally {
      setWishlistLoading(false);
    }
  }

  const itemTypeLabel = product?.item_type
    ? ITEM_TYPE_LABELS[product.item_type] ?? product.item_type
    : null;

  return (
    <StorefrontShell>
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300/50 hover:text-brand-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to main page
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-brand-accent">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>
          <p className="mt-4 text-lg font-semibold text-brand-ink">Loading product...</p>
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-semibold">Product not found</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
          >
            Continue shopping
          </Link>
        </div>
      ) : null}

      {!isLoading && !errorMessage && product ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-[0_28px_80px_rgba(7,17,31,0.08)]">
            <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_48%,#fff7ed_100%)]">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
                  Image unavailable
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.08)] sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {product.category ? (
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
                    {product.category}
                  </span>
                ) : null}
                {itemTypeLabel ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {itemTypeLabel}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                {product.name}
              </h1>

              {product.model ? (
                <p className="mt-2 text-sm text-slate-500">Model: {product.model}</p>
              ) : null}

              <p className="mt-6 text-4xl font-semibold text-brand-ink">
                {formatPrice(product.price)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${getStockClassName()}`}
                >
                  {getStockLabel()}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold transition ${
                    isOutOfStock
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : isAdded
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-brand-accent text-brand-ink hover:bg-brand-glow"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isOutOfStock
                    ? "Out of stock"
                    : isAdded
                      ? "Added to cart"
                      : "Add to cart"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm font-semibold transition ${
                    isWishlisted
                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300/50 hover:text-brand-ink"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
                  />
                  {isWishlisted ? "Saved" : "Save for later"}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_45px_rgba(7,17,31,0.06)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                Product details
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {product.description || "No description available."}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {product.distributor ? (
                  <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                    <Box className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Brand / Distributor
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-ink">
                        {product.distributor}
                      </p>
                    </div>
                  </div>
                ) : null}

                {product.serial_number ? (
                  <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                    <Tag className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Serial number
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-ink">
                        {product.serial_number}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Warranty
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-ink">
                      {product.warranty_status ? "Covered" : "Not covered"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Shipping
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-ink">
                      Free over $1,200
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </StorefrontShell>
  );
}
