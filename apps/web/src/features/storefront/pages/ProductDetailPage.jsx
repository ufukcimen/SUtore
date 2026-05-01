import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  Heart,
  MessageSquare,
  RefreshCcw,
  Send,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";
import { addProductToCart } from "../../cart/data/cartStorage";
import { StorefrontShell } from "../components/StorefrontShell";
import { useCategories } from "../context/CategoriesContext";

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

function getDiscountedPrice(product) {
  const price = Number(product?.price) || 0;
  const discount = Number(product?.discount_percent) || 0;
  return discount > 0 ? price * (1 - discount / 100) : price;
}

function buildVariantOptions(variants, currentVariant, valueKey, sortKey, pairedValueKey) {
  const seen = new Set();

  return variants
    .filter((variant) => {
      const value = variant[valueKey];
      if (!value || seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    })
    .map((variant) => {
      const selectedPairValue = currentVariant?.[pairedValueKey];
      const matchingCurrentPair = variants.find(
        (candidate) =>
          candidate[valueKey] === variant[valueKey] &&
          (!selectedPairValue || candidate[pairedValueKey] === selectedPairValue),
      );

      return {
        label: variant[valueKey],
        sortValue: Number(variant[sortKey]) || 0,
        product: matchingCurrentPair ?? variant,
      };
    })
    .sort((a, b) => a.sortValue - b.sortValue);
}

function StarRating({ rating, onSelect, interactive = false, size = "h-5 w-5" }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onSelect?.(value)}
          className={interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"}
        >
          <Star
            className={`${size} ${
              value <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function formatReviewDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const user = useStoredUser();
  const { categories } = useCategories();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ average_rating: null, review_count: 0 });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitState, setReviewSubmitState] = useState({ kind: "idle", message: "" });

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
    if (!productId) {
      setVariants([]);
      return;
    }

    let isActive = true;
    setVariants([]);
    setVariantsLoading(true);

    http
      .get(`/products/${productId}/variants`)
      .then((response) => {
        if (isActive) {
          setVariants(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch(() => {
        if (isActive) {
          setVariants([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setVariantsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [productId]);

  useEffect(() => {
    setIsAdded(false);
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

  useEffect(() => {
    if (!productId) {
      return;
    }

    let isActive = true;

    Promise.all([
      http.get(`/reviews/product/${productId}`),
      http.get(`/reviews/product/${productId}/summary`),
    ])
      .then(([reviewsRes, summaryRes]) => {
        if (isActive) {
          setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
          setReviewSummary(summaryRes.data ?? { average_rating: null, review_count: 0 });
        }
      })
      .catch(() => {
        if (isActive) {
          setReviews([]);
          setReviewSummary({ average_rating: null, review_count: 0 });
        }
      });

    return () => {
      isActive = false;
    };
  }, [productId]);

  const stockQuantity = product ? Number(product.stock_quantity) : 0;
  const remainingStock = Number.isFinite(stockQuantity)
    ? Math.max(Math.floor(stockQuantity), 0)
    : 0;
  const isOutOfStock = !product || remainingStock <= 0;
  const discount = product ? (Number(product.discount_percent) || 0) : 0;
  const hasDiscount = discount > 0;
  const originalPrice = product ? (Number(product.price) || 0) : 0;
  const discountedPrice = product ? getDiscountedPrice(product) : 0;
  const currentVariant =
    variants.find((variant) => String(variant.product_id) === String(product?.product_id)) ??
    product;
  const ramOptions = buildVariantOptions(
    variants,
    currentVariant,
    "ram_capacity",
    "ram_capacity_gb",
    "storage_capacity",
  );
  const storageOptions = buildVariantOptions(
    variants,
    currentVariant,
    "storage_capacity",
    "storage_capacity_gb",
    "ram_capacity",
  );
  const hasVariantChoices = ramOptions.length > 1 || storageOptions.length > 1;

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
      // Silently handle
    } finally {
      setWishlistLoading(false);
    }
  }

  function handleVariantSelect(nextProductId) {
    if (!nextProductId || String(nextProductId) === String(productId)) {
      return;
    }

    navigate(`/products/${nextProductId}`);
  }

  function renderVariantGroup(label, options, selectedValue) {
    if (options.length <= 1) {
      return null;
    }

    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = option.label === selectedValue;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => handleVariantSelect(option.product.product_id)}
                className={`min-w-[6.5rem] rounded-2xl border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-cyan-400 bg-cyan-50 text-brand-accent shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300/60 hover:text-brand-ink"
                }`}
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {formatPrice(getDiscountedPrice(option.product))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!user) {
      navigate("/login", { state: { from: `/products/${productId}` }, replace: true });
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewSubmitState({ kind: "error", message: "Please select a rating from 1 to 5 stars." });
      return;
    }

    if (!reviewComment.trim()) {
      setReviewSubmitState({ kind: "error", message: "Please write a comment." });
      return;
    }

    setReviewSubmitting(true);
    setReviewSubmitState({ kind: "idle", message: "" });

    try {
      await http.post("/reviews", {
        user_id: user.user_id,
        product_id: Number(productId),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewRating(0);
      setReviewComment("");
      setReviewSubmitState({
        kind: "success",
        message: "Your review has been submitted and is pending approval. It will appear publicly once a product manager approves it.",
      });
    } catch (error) {
      const detail = error.response?.data?.detail;
      setReviewSubmitState({
        kind: "error",
        message: typeof detail === "string" ? detail : "Could not submit your review. Please try again.",
      });
    } finally {
      setReviewSubmitting(false);
    }
  }

  const itemTypeLabel = (() => {
    if (!product?.item_type) return null;
    for (const cat of categories) {
      const match = cat.item_types?.find((t) =>
        (typeof t === "string" ? t : t.value) === product.item_type
      );
      if (match) return typeof match === "string" ? match : match.label;
    }
    return product.item_type;
  })();

  const userAlreadyReviewed = user
    ? reviews.some((r) => r.user_id === user.user_id)
    : false;

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
        <>
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

                <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                  {product.name}
                </h1>

                {product.model ? (
                  <p className="mt-2 text-sm text-slate-500">Model: {product.model}</p>
                ) : null}

                {reviewSummary.review_count > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <StarRating rating={Math.round(reviewSummary.average_rating ?? 0)} />
                    <span className="text-sm font-semibold text-slate-700">
                      {reviewSummary.average_rating}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({reviewSummary.review_count} {reviewSummary.review_count === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                ) : null}

                <div className="mt-6">
                  {hasDiscount ? (
                    <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
                      <p className="text-3xl font-semibold text-brand-ink sm:text-4xl">
                        {formatPrice(discountedPrice)}
                      </p>
                      <div>
                        <p className="text-lg text-slate-400 line-through">{formatPrice(originalPrice)}</p>
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          {discount}% OFF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-3xl font-semibold text-brand-ink sm:text-4xl">
                      {formatPrice(originalPrice)}
                    </p>
                  )}
                </div>

                {hasVariantChoices ? (
                  <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-ink">Configuration</p>
                      {variantsLoading ? (
                        <span className="text-xs font-semibold text-slate-400">Updating</span>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-4">
                      {renderVariantGroup("RAM", ramOptions, currentVariant?.ram_capacity)}
                      {renderVariantGroup("SSD capacity", storageOptions, currentVariant?.storage_capacity)}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${getStockClassName()}`}
                  >
                    {getStockLabel()}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold transition min-[420px]:w-auto ${
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
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-sm font-semibold transition min-[420px]:w-auto ${
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
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Brand / Distributor</p>
                        <p className="mt-1 text-sm font-semibold text-brand-ink">{product.distributor}</p>
                      </div>
                    </div>
                  ) : null}

                  {product.serial_number ? (
                    <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                      <Tag className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Serial number</p>
                        <p className="mt-1 text-sm font-semibold text-brand-ink">{product.serial_number}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warranty</p>
                      <p className="mt-1 text-sm font-semibold text-brand-ink">{product.warranty_status ? "Covered" : "Not covered"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shipping</p>
                      <p className="mt-1 text-sm font-semibold text-brand-ink">Free over $1,200</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews section ── */}
          <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.08)] sm:p-8">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-brand-accent" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                Customer reviews
              </p>
            </div>

            {reviewSummary.review_count > 0 ? (
              <div className="mt-4 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(reviewSummary.average_rating ?? 0)} size="h-6 w-6" />
                  <span className="text-2xl font-semibold text-brand-ink">
                    {reviewSummary.average_rating}
                  </span>
                </div>
                <span className="text-sm text-slate-500">
                  Based on {reviewSummary.review_count} {reviewSummary.review_count === 1 ? "review" : "reviews"}
                </span>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>
            )}

            {/* Approved reviews list */}
            {reviews.length > 0 ? (
              <div className="mt-6 space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.review_id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
                  >
                    <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                      <div className="flex items-center gap-3">
                        <StarRating rating={review.rating} size="h-4 w-4" />
                        <span className="text-sm font-semibold text-brand-ink">
                          {review.user_name || "Anonymous"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatReviewDate(review.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Submit review form */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-brand-ink">
                {userAlreadyReviewed
                  ? "You have already reviewed this product."
                  : "Write a review"}
              </p>

              {!userAlreadyReviewed && reviewSubmitState.kind !== "success" ? (
                <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Your rating
                    </p>
                    <StarRating
                      rating={reviewRating}
                      onSelect={setReviewRating}
                      interactive
                      size="h-7 w-7"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Your comment
                    </label>
                    <textarea
                      id="review-comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      maxLength={2000}
                      className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
                    />
                  </div>

                  {reviewSubmitState.kind === "error" ? (
                    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {reviewSubmitState.message}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {reviewSubmitting ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              ) : null}

              {reviewSubmitState.kind === "success" ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {reviewSubmitState.message}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </StorefrontShell>
  );
}
