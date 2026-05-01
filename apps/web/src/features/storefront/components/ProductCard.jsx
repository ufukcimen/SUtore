import { useState } from "react";
import { Link } from "react-router-dom";
import { addProductToCart } from "../../cart/data/cartStorage";

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

export function ProductCard({ product, compact = false, floating = false }) {
  const [isAdded, setIsAdded] = useState(false);
  const stockQuantity = Number(product.stock_quantity);
  const remainingStock = Number.isFinite(stockQuantity) ? Math.max(Math.floor(stockQuantity), 0) : 0;
  const isOutOfStock = remainingStock <= 0;
  const discount = Number(product.discount_percent) || 0;
  const hasDiscount = discount > 0;
  const originalPrice = Number(product.price) || 0;
  const discountedPrice = hasDiscount ? originalPrice * (1 - discount / 100) : originalPrice;

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
    if (isOutOfStock) {
      return;
    }

    addProductToCart(product);
    setIsAdded(true);
  }

  const productUrl = `/products/${product.product_id ?? product.id}`;

  const articleClassName = floating
    ? "overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/95 shadow-[0_8px_30px_rgba(7,17,31,0.08),0_1.5px_4px_rgba(7,17,31,0.04)] backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(7,17,31,0.14),0_8px_20px_rgba(7,17,31,0.06)] hover:border-cyan-200/50"
    : "overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-[0_18px_45px_rgba(7,17,31,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(7,17,31,0.12)]";

  return (
    <article className={articleClassName}>
      <Link to={productUrl} className="relative block">
        <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_48%,#fff7ed_100%)]">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
              Image unavailable
            </div>
          )}
        </div>
        {hasDiscount ? (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{discount}%
          </span>
        ) : null}
      </Link>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col items-start justify-between gap-3 min-[420px]:flex-row min-[420px]:gap-4">
          <div className="min-w-0">
            {product.category ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                {product.category}
              </p>
            ) : null}
            <Link to={productUrl} className="block">
              <h2 className={`mt-2 break-words text-lg font-semibold text-brand-ink transition hover:text-brand-accent sm:text-xl${compact ? " line-clamp-1" : ""}`}>{product.name}</h2>
            </Link>
          </div>
          <div className="shrink-0 rounded-2xl bg-cyan-50 px-3 py-2 text-left min-[420px]:text-right">
            {hasDiscount ? (
              <>
                <p className="text-xs text-slate-400 line-through">{formatPrice(originalPrice)}</p>
                <p className="text-sm font-semibold text-brand-accent">{formatPrice(discountedPrice)}</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-brand-accent">{formatPrice(originalPrice)}</p>
            )}
          </div>
        </div>

        {!compact ? (
          <p className="line-clamp-4 text-sm leading-6 text-slate-600">
            {product.description || "Description not available."}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStockClassName()}`}
          >
            {getStockLabel()}
          </span>
          {hasDiscount ? (
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              {discount}% OFF
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto ${
            isOutOfStock
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : isAdded
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-brand-accent text-brand-ink hover:bg-brand-glow"
          }`}
        >
          {isOutOfStock ? "Out of stock" : isAdded ? "Added to cart ->" : "Add to cart ->"}
        </button>
      </div>
    </article>
  );
}
