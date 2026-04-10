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

export function LaptopCard({ product, compact = false }) {
  const [isAdded, setIsAdded] = useState(false);
  const stockQuantity = Number(product.stock_quantity);
  const remainingStock = Number.isFinite(stockQuantity) ? Math.max(Math.floor(stockQuantity), 0) : 0;
  const isOutOfStock = remainingStock <= 0;

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

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-[0_18px_45px_rgba(7,17,31,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(7,17,31,0.12)]">
      <Link to={productUrl} className="block">
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
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {product.category ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                {product.category}
              </p>
            ) : null}
            <Link to={productUrl} className="block">
              <h2 className={`mt-2 text-xl font-semibold text-brand-ink hover:text-brand-accent transition${compact ? " line-clamp-1" : ""}`}>{product.name}</h2>
            </Link>
          </div>
          <p className="shrink-0 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-brand-accent">
            {formatPrice(product.price)}
          </p>
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
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
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
