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
      <div className="receipt-print-layout grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-6">
          <div className="receipt-card receipt-hero rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
            <div className="receipt-success-icon grid h-16 w-16 place-items-center rounded-lg bg-emerald-500 text-white shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Success
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Thank you. Your order is now in the confirmation stage.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              We have received your billing and payment details and generated a receipt
              summary for this order.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="receipt-meta-card rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Order number
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {confirmation.orderNumber}
                </p>
              </div>
              <div className="receipt-meta-card rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Confirmed at
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {confirmation.placedAtLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="receipt-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="receipt-accent-icon grid h-11 w-11 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    Billing details
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
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

            <article className="receipt-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="receipt-warm-icon grid h-11 w-11 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    Payment reference
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {confirmation.payment.brand} ending in {confirmation.payment.last4}
                  </h3>
                </div>
              </div>

              <div className="receipt-note-card mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                A confirmation summary has been prepared for this order. You can print
                or save the receipt for your records.
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row" data-print-hidden="true">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Continue shopping
                </Link>
                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-950 text-white hover:bg-slate-800"
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
            <div className="receipt-card rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <ReceiptText className="h-5 w-5 text-cyan-700" />
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
