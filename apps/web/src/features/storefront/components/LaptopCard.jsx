import { useState } from "react";
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

export function LaptopCard({ product }) {
  const [isAdded, setIsAdded] = useState(false);
  const isOutOfStock = Number(product.stock_quantity) <= 0;

  function handleAddToCart() {
    if (isOutOfStock) {
      return;
    }

    addProductToCart(product);
    setIsAdded(true);
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-[0_18px_45px_rgba(7,17,31,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(7,17,31,0.12)]">
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

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {product.category ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                {product.category}
              </p>
            ) : null}
            <h2 className="mt-2 text-xl font-semibold text-brand-ink">{product.name}</h2>
          </div>
          <p className="shrink-0 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-brand-accent">
            {formatPrice(product.price)}
          </p>
        </div>

        <p className="line-clamp-4 text-sm leading-6 text-slate-600">
          {product.description || "Description not available."}
        </p>

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
