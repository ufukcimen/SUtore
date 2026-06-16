import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";
import { addProductToCart } from "../../cart/data/cartStorage";
import { CompareToggle } from "../context/CompareContext";
import {
  PriceBlock,
  ProductImageFrame,
  StockBadge,
} from "./RetailPrimitives";
import {
  getDiscount,
  formatItemTypeLabel,
  formatLabel,
  getProductImageTreatment,
  getProductSpecHighlights,
  getProductUrl,
  getStockQuantity,
} from "../utils/productPresentation";

export function ProductCard({
  product,
  compact = false,
  floating = false,
  variant,
  showCompare = true,
  showWishlist = true,
  showQuickAdd = true,
}) {
  const navigate = useNavigate();
  const user = useStoredUser();
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const resolvedVariant = variant ?? (compact ? "compact" : floating ? "carousel" : "grid");
  const isCompact = resolvedVariant === "compact" || resolvedVariant === "carousel";
  const productUrl = getProductUrl(product);
  const isOutOfStock = getStockQuantity(product) <= 0;
  const discount = getDiscount(product);
  const specHighlights = getProductSpecHighlights(product).slice(0, isCompact ? 2 : 3);
  const imageTreatment = getProductImageTreatment(product);
  const categoryLabel = product.category ? formatLabel(product.category) : "";
  const itemTypeLabel = product.item_type ? formatItemTypeLabel(product.item_type) : "";
  const showItemTypeLabel =
    itemTypeLabel && itemTypeLabel.toLowerCase() !== categoryLabel.toLowerCase();

  function handleAddToCart() {
    if (isOutOfStock) {
      return;
    }

    addProductToCart(product);
    setIsAdded(true);
  }

  async function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!user?.user_id) {
      navigate("/login", { state: { from: productUrl } });
      return;
    }

    const productId = product.product_id ?? product.id;
    if (!productId || wishlistLoading) {
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
          product_id: productId,
        });
        setIsWishlisted(true);
      }
    } catch {
      setIsWishlisted((current) => current);
    } finally {
      setWishlistLoading(false);
    }
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
      <div className="relative p-3 pb-0">
        <Link to={productUrl} className="block">
          <ProductImageFrame
            src={product.image_url}
            alt={product.name}
            className={`${isCompact ? "aspect-[5/4]" : "aspect-[4/3]"} ${imageTreatment.frameClassName}`}
            imageClassName={`${imageTreatment.imageClassName} transition duration-300 group-hover:scale-[1.025]`}
          />
        </Link>

        {discount > 0 ? (
          <span className="absolute left-5 top-5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{discount}%
          </span>
        ) : null}

        <div className="absolute right-5 top-5 flex gap-2">
          {showWishlist ? (
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`grid h-9 w-9 place-items-center rounded-md border bg-white/95 shadow-sm transition ${
                isWishlisted
                  ? "border-rose-200 text-rose-600"
                  : "border-slate-200 text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
              }`}
              aria-label={isWishlisted ? "Remove from wishlist" : "Save for later"}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel ? (
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-cyan-700">
                {categoryLabel}
              </span>
            ) : null}
            {showItemTypeLabel ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {itemTypeLabel}
              </span>
            ) : null}
          </div>

          <Link to={productUrl} className="block">
            <h2 className="mt-2 line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-6 text-slate-950 transition group-hover:text-cyan-700">
              {product.name}
            </h2>
          </Link>

          {specHighlights.length > 0 ? (
            <ul className="mt-3 min-h-[3rem] space-y-1 text-sm text-slate-600">
              {specHighlights.map((item) => (
                <li key={item} className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span className="min-w-0 flex-1 truncate">{item}</span>
                </li>
              ))}
            </ul>
          ) : !isCompact ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
              {product.description || "Product details available on the product page."}
            </p>
          ) : null}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex min-h-[3.75rem] items-start justify-between gap-3">
            <PriceBlock product={product} />
            <StockBadge product={product} className="shrink-0" />
          </div>

          <div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row">
            {showQuickAdd ? (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  isOutOfStock
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : isAdded
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {isOutOfStock
                  ? "Out"
                  : isAdded
                    ? "Added"
                    : isCompact
                      ? "Add"
                      : "Add to cart"}
              </button>
            ) : null}
            {showCompare ? <CompareToggle product={product} compact={isCompact} /> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
