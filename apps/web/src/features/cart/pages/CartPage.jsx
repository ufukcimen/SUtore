import {
  ArrowRight,
  Cpu,
  HardDrive,
  Laptop,
  Monitor,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OrderSummaryPanel } from "../components/OrderSummaryPanel";
import { StorefrontPageShell } from "../components/StorefrontPageShell";
import { formatCurrency } from "../data/cartStorage";
import { useCart } from "../hooks/useCart";

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

export function CartPage() {
  const { items, removeItem, summary, updateQuantity } = useCart();

  return (
    <StorefrontPageShell
      currentStep="cart"
      description="Review your selected components, adjust quantities, and move to payment when the order looks right."
      eyebrow="Cart"
      title="Everything you need for the next build is here."
    >
      {items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
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
                  className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(7,17,31,0.1)] sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      {hasImage ? (
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_48%,#fff7ed_100%)] shadow-sm">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className={`grid h-24 w-24 shrink-0 place-items-center rounded-[1.5rem] ${iconStyle}`}
                        >
                          <Icon className="h-9 w-9" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {item.category || "Product"}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.availability || "Availability pending"}
                          </span>
                        </div>
                        <h2 className="mt-3 break-words text-lg font-semibold text-brand-ink sm:text-xl">{item.name}</h2>
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

                    <div className="shrink-0 rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-5 py-4 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Line total
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-brand-ink">
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
                    <div className="inline-flex w-fit items-center rounded-2xl border border-slate-200 bg-slate-50/90 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] text-slate-600 transition hover:bg-white hover:text-brand-ink"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-12 text-center text-sm font-semibold text-brand-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={!canIncreaseQuantity}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] text-slate-600 transition hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:w-auto"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Go to payment
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center shadow-[0_20px_60px_rgba(7,17,31,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
            Cart cleared
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-brand-ink">Your cart is empty.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Products you select from the storefront will appear here with quantity
            controls, shipping details, and order totals.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      )}
    </StorefrontPageShell>
  );
}
