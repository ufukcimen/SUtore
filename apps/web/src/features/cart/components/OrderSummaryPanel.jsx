import { formatCurrency } from "../data/cartStorage";

export function OrderSummaryPanel({ action, items, note, summary, title = "Order summary" }) {
  return (
    <aside className="receipt-card rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.12)] lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
        {title}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-brand-ink">
        {items.length > 0 ? `${items.length} products ready` : "Your cart is empty"}
      </h2>

      <div className="mt-6 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="receipt-line-item flex items-start justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-ink">{item.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Qty {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-brand-ink">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))
        ) : (
          <div className="receipt-note-card rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 text-sm leading-6 text-slate-600">
            Add products to continue with billing and payment.
          </div>
        )}
      </div>

      <dl className="mt-6 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-brand-ink">{formatCurrency(summary.subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Shipping</dt>
          <dd className="font-semibold text-brand-ink">
            {summary.shipping === 0 ? "Free" : formatCurrency(summary.shipping)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Estimated tax</dt>
          <dd className="font-semibold text-brand-ink">{formatCurrency(summary.tax)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-brand-ink">
          <dt>Total</dt>
          <dd>{formatCurrency(summary.total)}</dd>
        </div>
      </dl>

      <div className="mt-6">{action}</div>
      {note ? <p className="mt-4 text-xs leading-6 text-slate-500">{note}</p> : null}
    </aside>
  );
}
