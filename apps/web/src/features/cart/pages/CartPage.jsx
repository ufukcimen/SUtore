import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  HardDrive,
  Laptop,
  Monitor,
  Minus,
  PackageSearch,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OrderSummaryPanel } from "../components/OrderSummaryPanel";
import { StorefrontPageShell } from "../components/StorefrontPageShell";
import { formatCurrency } from "../data/cartStorage";
import { useCart } from "../hooks/useCart";
import { RecentlyViewedRail } from "../../storefront/context/RecentlyViewedContext";

const itemIcons = {
  graphics: Cpu,
  storage: HardDrive,
  monitor: Monitor,
  laptop: Laptop,
  desktop: Cpu,
  component: Sparkles,
};

const itemIconStyles = {
  graphics: "bg-cyan-400/15 text-brand-accent",
  storage: "bg-brand-gold/15 text-amber-700",
  monitor: "bg-emerald-400/15 text-emerald-700",
  laptop: "bg-cyan-400/15 text-brand-accent",
  desktop: "bg-indigo-400/15 text-indigo-700",
  component: "bg-brand-gold/15 text-amber-700",
};

function describeStockChange(change) {
  if (change.type === "removed") {
    return change.reason === "out_of_stock"
      ? `${change.name} is now out of stock and was removed from your cart.`
      : `${change.name} is no longer available and was removed from your cart.`;
  }
  if (change.type === "quantity_reduced") {
    return `${change.name} quantity was reduced from ${change.previousQuantity} to ${change.nextQuantity} to match current stock.`;
  }
  return `${change.name} availability was updated.`;
}

export function CartPage() {
  const {
    clearCart,
    items,
    removeItem,
    summary,
    updateQuantity,
    stockChanges,
    dismissStockChanges,
  } = useCart();
  const isCartEmpty = items.length === 0;

  return (
    <StorefrontPageShell
      currentStep="cart"
      description="Review your selected components, adjust quantities, and move to payment when the order looks right."
      eyebrow="Cart"
      title="Review your cart."
    >
      {stockChanges.length > 0 ? (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Cart updated to match current stock</p>
            <ul className="list-disc space-y-1 pl-5">
              {stockChanges.map((change, index) => (
                <li key={`${change.type}-${change.name}-${index}`}>
                  {describeStockChange(change)}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={dismissStockChanges}
            className="rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
            aria-label="Dismiss stock update notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {!isCartEmpty ? (
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            Remove all
          </button>
        </div>
      ) : null}

      {!isCartEmpty ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-5">
            {items.map((item) => {
              const Icon = itemIcons[item.type] ?? Cpu;
              const iconStyle = itemIconStyles[item.type] ?? "bg-cyan-400/15 text-brand-accent";
              const hasImage = typeof item.imageUrl === "string" && item.imageUrl.trim().length > 0;
              const stockQuantity = Number(item.stockQuantity);
              const canIncreaseQuantity =
                !Number.isFinite(stockQuantity) || item.quantity < stockQuantity;

              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      {hasImage ? (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-2 shadow-sm">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className={`grid h-24 w-24 shrink-0 place-items-center rounded-md ${iconStyle}`}
                        >
                          <Icon className="h-9 w-9" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            {item.category || "Product"}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.availability || "Availability pending"}
                          </span>
                        </div>
                        <h2 className="mt-3 break-words text-lg font-semibold text-slate-950 sm:text-xl">{item.name}</h2>
                        <p className="mt-2 break-words text-sm text-slate-600">
                          {(item.variant || "Standard configuration") + " | SKU " + (item.sku || "N/A")}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Truck className="h-4 w-4 text-brand-accent" />
                            {item.shippingLabel || "Shipping details pending"}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-brand-accent" />
                            Standard warranty included
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-5 py-4 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Line total
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {item.originalPrice ? (
                        <>
                          <p className="mt-1 text-xs text-slate-400 line-through">
                            {formatCurrency(item.originalPrice)} each
                          </p>
                          <p className="text-sm text-rose-600 font-semibold">
                            {formatCurrency(item.price)} each ({item.discountPercent}% off)
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex w-fit items-center rounded-md border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-950"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-12 text-center text-sm font-semibold text-slate-950">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={!canIncreaseQuantity}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <OrderSummaryPanel
            items={items}
            note="Shipping and tax are estimated here. Secure card details and billing information are completed on the next step."
            summary={summary}
            action={
              <Link
                to="/checkout"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Go to payment
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                <PackageSearch className="h-7 w-7" />
              </div>
              <div className="mx-auto mt-5 max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Cart cleared
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                  Your cart is empty.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Products you select from the storefront will appear here with quantity
                  controls, shipping details, and order totals.
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/category/pc-components"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Shop components
                </Link>
                <Link
                  to="/custom-pc-creator"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  Open PC builder
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Checkout confidence
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Clear shipping labels</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Delivery details stay visible before payment.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Warranty shown up front</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Coverage labels follow products into checkout.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Compare before buying</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Shortlist up to four parts while you shop.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <div className="mt-8">
            <RecentlyViewedRail />
          </div>
        </>
      )}
    </StorefrontPageShell>
  );
}
