import { CheckCircle2, CreditCard, PackageCheck, ReceiptText } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { OrderSummaryPanel } from "../components/OrderSummaryPanel";
import { StorefrontPageShell } from "../components/StorefrontPageShell";
import { readOrderConfirmation } from "../data/orderConfirmationStorage";

export function CheckoutSuccessPage() {
  const confirmation = readOrderConfirmation();

  if (!confirmation) {
    return <Navigate to="/checkout" replace />;
  }

  return (
    <StorefrontPageShell
      currentStep="checkout"
      description="Your order details have been received and the checkout flow now continues into a confirmation experience consistent with the rest of the store."
      eyebrow="Order confirmed"
      title="Payment details accepted and your order is confirmed."
    >
      <div className="receipt-print-layout grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <section className="space-y-6">
          <div className="receipt-card receipt-hero rounded-[2rem] border border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.92))] p-8 shadow-[0_24px_70px_rgba(7,17,31,0.1)]">
            <div className="receipt-success-icon grid h-20 w-20 place-items-center rounded-[1.75rem] bg-emerald-500 text-white shadow-[0_18px_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Success
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-brand-ink sm:text-4xl">
              Thank you. Your order is now in the confirmation stage.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              We have received your billing and payment details and generated a receipt
              summary for this order.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="receipt-meta-card rounded-[1.5rem] border border-white/80 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Order number
                </p>
                <p className="mt-2 text-xl font-semibold text-brand-ink">
                  {confirmation.orderNumber}
                </p>
              </div>
              <div className="receipt-meta-card rounded-[1.5rem] border border-white/80 bg-white/85 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Confirmed at
                </p>
                <p className="mt-2 text-xl font-semibold text-brand-ink">
                  {confirmation.placedAtLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="receipt-card rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(7,17,31,0.1)]">
              <div className="flex items-start gap-4">
                <div className="receipt-accent-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/15 text-brand-accent">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                    Billing details
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-brand-ink">
                    {confirmation.billingName}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                <p>{confirmation.billingEmail}</p>
                <p>{confirmation.billingPhone}</p>
                <p>{confirmation.billingAddress}</p>
              </div>
            </article>

            <article className="receipt-card rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_60px_rgba(7,17,31,0.1)]">
              <div className="flex items-start gap-4">
                <div className="receipt-warm-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gold/15 text-amber-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                    Payment reference
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-brand-ink">
                    {confirmation.payment.brand} ending in {confirmation.payment.last4}
                  </h3>
                </div>
              </div>

              <div className="receipt-note-card mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5 text-sm leading-7 text-slate-600">
                A confirmation summary has been prepared for this order. You can print
                or save the receipt for your records.
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row" data-print-hidden="true">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
                >
                  Continue shopping
                </Link>
                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-brand-ink text-white hover:bg-slate-900"
                >
                  Print receipt
                </Button>
              </div>
            </article>
          </div>
        </section>

        <OrderSummaryPanel
          items={confirmation.items}
          note="Save or print this summary for your records."
          summary={confirmation.summary}
          title="Order summary"
          action={
            <div className="receipt-card rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <ReceiptText className="h-5 w-5 text-brand-accent" />
                <p>
                  Receipt summary generated successfully for this order.
                </p>
              </div>
            </div>
          }
        />
      </div>
    </StorefrontPageShell>
  );
}
