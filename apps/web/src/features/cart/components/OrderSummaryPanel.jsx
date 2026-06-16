import { formatCurrency } from "../data/cartStorage";

export function OrderSummaryPanel({ action, items, note, summary, title = "Order summary" }) {
  return (
    <aside className="receipt-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
        {title}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">
        {items.length > 0 ? `${items.length} products ready` : "Your cart is empty"}
      </h2>

      <div className="mt-5 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="receipt-line-item flex items-start justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-slate-950">{item.name}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Qty {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-950">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))
        ) : (
          <div className="receipt-note-card rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
            Add products to continue with billing and payment.
          </div>
        )}
      </div>

      <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-slate-950">{formatCurrency(summary.subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Shipping</dt>
          <dd className="font-semibold text-slate-950">
            {summary.shipping === 0 ? "Free" : formatCurrency(summary.shipping)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Estimated tax</dt>
          <dd className="font-semibold text-slate-950">{formatCurrency(summary.tax)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
          <dt>Total</dt>
          <dd>{formatCurrency(summary.total)}</dd>
        </div>
      </dl>

      <div className="mt-5">{action}</div>
      {note ? <p className="mt-4 text-xs leading-5 text-slate-500">{note}</p> : null}
    </aside>
  );
}
