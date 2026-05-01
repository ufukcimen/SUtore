import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { CartItemCountBadge } from "./CartItemCountBadge";

function getNavClassName(isActive) {
  return `inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "border-cyan-300/50 bg-cyan-400/15 text-white"
      : "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-white/10"
  }`;
}

export function StorefrontPageShell({
  children,
  currentStep,
  description,
  eyebrow,
  title,
}) {
  const { distinctItemCount } = useCart();

  return (
    <div className="storefront-page-shell min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7fbff_0%,#ecfeff_45%,#fff8eb_100%)] text-slate-950">
      <div className="absolute inset-0 bg-grid bg-[size:28px_28px] opacity-25" />
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-brand-glow/30 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-gold/20 blur-3xl" />
      <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      <header className="checkout-shell-header relative z-20 overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />

        <div className="relative mx-auto flex max-w-[90rem] flex-wrap items-center gap-3 px-3 py-4 sm:gap-4 sm:px-4 lg:flex-nowrap lg:justify-between lg:px-5">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4 lg:min-w-[18rem]">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/10 sm:rounded-2xl sm:px-4 sm:py-2.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden min-[390px]:inline">Continue shopping</span>
            </Link>

            <Link to="/" className="min-w-0 shrink-0">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="rounded-xl bg-[linear-gradient(135deg,#22d3ee,#2563eb)] px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-950 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm sm:tracking-[0.3em]">
                  SU
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">SUtore</p>
                  <p className="hidden text-xs uppercase tracking-[0.32em] text-cyan-200/70 sm:block">
                    Checkout Experience
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="order-3 w-full md:order-none md:flex-1 md:px-6 lg:mx-auto lg:max-w-3xl lg:min-w-0 lg:px-10" />

          <nav className="ml-auto flex shrink-0 items-center gap-2 lg:min-w-[8rem] lg:justify-end">
            <Link to="/cart" className={getNavClassName(currentStep === "cart")}>
              <ShoppingCart className="h-4 w-4" />
              Cart
              <CartItemCountBadge count={distinctItemCount} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
        <section className="checkout-shell-intro rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_28px_80px_rgba(7,17,31,0.12)] sm:rounded-[2rem] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-brand-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {description}
          </p>
        </section>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
