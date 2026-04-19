import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Download, LoaderCircle, ReceiptText } from "lucide-react";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { formatCurrency } from "../../cart/data/cartStorage";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";

function getUserDisplayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "Account";
}

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item?.msg).filter(Boolean).join(" ");
  }
  return fallback;
}

function formatOrderDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeOrderStatus(status) {
  return typeof status === "string" ? status.trim().toLowerCase() : "";
}

function isPastOrderStatus(status) {
  return ["completed", "delivered", "cancelled", "refunded"].includes(
    normalizeOrderStatus(status),
  );
}

function getOrderStatusBadge(status) {
  const normalizedStatus = normalizeOrderStatus(status);

  if (normalizedStatus === "cancelled" || normalizedStatus === "refunded") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (normalizedStatus === "completed" || normalizedStatus === "delivered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-cyan-200 bg-cyan-50 text-brand-accent";
}

function formatStatusLabel(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  if (!normalizedStatus) {
    return "Pending";
  }

  return normalizedStatus
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function handleDownloadInvoice(order) {
  const invoiceWindow = window.open("", "_blank");
  if (!invoiceWindow) return;

  const itemsHtml = order.items
    .map(
      (item) => `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-radius:1.5rem;border:1px solid rgba(226,232,240,1);background:rgba(248,250,252,0.9);padding:16px">
          <div style="min-width:0">
            <p style="font-size:14px;font-weight:600;color:#07111f">${item.product_name}</p>
            <p style="margin-top:4px;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#64748b">Qty ${item.quantity}</p>
          </div>
          <p style="flex-shrink:0;font-size:14px;font-weight:600;color:#07111f">${formatCurrency(Number(item.line_total) || 0)}</p>
        </div>`,
    )
    .join("");

  invoiceWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.order_number}</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Sora:wght@400;600;700&display=swap");
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:"Space Grotesk",sans-serif; background:#f7fbff; color:#07111f; padding:40px 24px; }
    h1,h2,h3,h4,h5,h6 { font-family:"Sora",sans-serif; }
    .layout { max-width:1120px; margin:0 auto; display:grid; gap:24px; grid-template-columns:minmax(0,1.45fr) minmax(320px,0.9fr); }
    .card { border-radius:2rem; border:1px solid rgba(226,232,240,0.8); background:rgba(255,255,255,0.92); padding:24px; box-shadow:0 20px 60px rgba(7,17,31,0.1); }
    .card-hero { border-radius:2rem; border:1px solid rgba(226,232,240,0.8); background:linear-gradient(180deg,rgba(240,249,255,0.95),rgba(255,255,255,0.92)); padding:32px; box-shadow:0 24px 70px rgba(7,17,31,0.1); }
    .icon-box { display:grid; width:48px; height:48px; flex-shrink:0; place-items:center; border-radius:1rem; }
    .icon-cyan { background:rgba(0,209,178,0.12); color:#00d1b2; }
    .icon-amber { background:rgba(246,196,83,0.15); color:#b45309; }
    .eyebrow { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.28em; color:#00d1b2; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:32px; }
    .meta-card { border-radius:1.5rem; border:1px solid rgba(255,255,255,0.8); background:rgba(255,255,255,0.85); padding:20px; }
    .meta-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.24em; color:#64748b; }
    .meta-value { margin-top:8px; font-size:20px; font-weight:600; color:#07111f; font-family:"Sora",sans-serif; }
    .cards-grid { display:grid; gap:24px; grid-template-columns:1fr 1fr; margin-top:24px; }
    .note-card { margin-top:24px; border-radius:1.5rem; border:1px solid #e2e8f0; background:rgba(248,250,252,0.9); padding:20px; font-size:14px; line-height:1.75; color:#475569; }
    .summary-panel { border-radius:2rem; border:1px solid rgba(226,232,240,0.8); background:rgba(255,255,255,0.92); padding:24px; box-shadow:0 28px 80px rgba(7,17,31,0.12); }
    .summary-items { margin-top:24px; display:flex; flex-direction:column; gap:16px; }
    .summary-totals { margin-top:24px; border-top:1px solid #e2e8f0; padding-top:24px; display:flex; flex-direction:column; gap:12px; font-size:14px; color:#475569; }
    .summary-row { display:flex; justify-content:space-between; align-items:center; }
    .summary-row-value { font-weight:600; color:#07111f; }
    .summary-total-row { display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; margin-top:4px; font-size:16px; font-weight:600; color:#07111f; }
    .receipt-footer { margin-top:24px; border-radius:1.5rem; border:1px solid #e2e8f0; background:rgba(248,250,252,0.9); padding:16px; display:flex; align-items:center; gap:12px; font-size:14px; color:#475569; }
    .receipt-footer svg { width:20px; height:20px; color:#00d1b2; flex-shrink:0; }
    .btn-print { display:inline-flex; align-items:center; justify-content:center; border-radius:1rem; padding:12px 20px; font-size:14px; font-weight:600; font-family:inherit; border:none; cursor:pointer; transition:background 0.15s; }
    .btn-primary { background:#07111f; color:#fff; }
    .btn-primary:hover { background:#1e293b; }
    .btn-accent { background:#00d1b2; color:#07111f; }
    .btn-accent:hover { background:#5eead4; }
    @media print {
      @page { margin:14mm; }
      html, body { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
      body { padding:0; background:#f7fbff; }
      .no-print { display:none !important; }
      .layout { display:block !important; }
      .layout > * { width:100% !important; }
      .card, .card-hero, .summary-panel { break-inside:avoid; box-shadow:none !important; border:1px solid #d9e4f0 !important; background:rgba(255,255,255,0.96) !important; margin-bottom:18px; }
      .card-hero { background:linear-gradient(180deg,#ecfdf5 0%,#eff6ff 100%) !important; border-color:#a7f3d0 !important; }
      .meta-card { background:#f8fbff !important; border-color:#d9e4f0 !important; }
    }
    @media (max-width:900px) {
      .layout { grid-template-columns:1fr; }
      .cards-grid { grid-template-columns:1fr; }
      .meta-grid { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <div style="display:flex;flex-direction:column;gap:24px">

      <!-- Order info hero -->
      <div class="card-hero">
        <p class="eyebrow">Invoice</p>
        <h2 style="margin-top:12px;font-size:28px;font-weight:600;color:#07111f;font-family:'Sora',sans-serif">
          Order ${order.order_number}
        </h2>
        <p style="margin-top:16px;max-width:600px;font-size:14px;line-height:1.75;color:#475569">
          Invoice generated from your order. You can print or save this page as a PDF for your records.
        </p>
        <div class="meta-grid">
          <div class="meta-card">
            <p class="meta-label">Order number</p>
            <p class="meta-value">${order.order_number}</p>
          </div>
          <div class="meta-card">
            <p class="meta-label">Order date</p>
            <p class="meta-value" style="font-size:16px">${formatOrderDate(order.created_at)}</p>
          </div>
        </div>
      </div>

      <!-- Billing + Payment cards -->
      <div class="cards-grid">
        <div class="card">
          <div style="display:flex;align-items:flex-start;gap:16px">
            <div class="icon-box icon-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            </div>
            <div>
              <p class="eyebrow">Billing details</p>
              <h3 style="margin-top:8px;font-size:24px;font-weight:600;color:#07111f;font-family:'Sora',sans-serif">${order.billing_name}</h3>
            </div>
          </div>
          <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px;font-size:14px;line-height:1.75;color:#475569">
            <p>${order.billing_email}</p>
            <p>${order.billing_phone}</p>
            <p>${order.billing_address}</p>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:flex-start;gap:16px">
            <div class="icon-box icon-amber">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <div>
              <p class="eyebrow">Payment reference</p>
              <h3 style="margin-top:8px;font-size:24px;font-weight:600;color:#07111f;font-family:'Sora',sans-serif">${order.payment_brand} ending in ${order.payment_last4}</h3>
            </div>
          </div>
          <div class="note-card">
            This is an invoice for order ${order.order_number}. You can print or save this document for your records.
          </div>
          <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap" class="no-print">
            <button onclick="window.print()" class="btn-print btn-primary">Print / Save as PDF</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Order summary sidebar -->
    <div class="summary-panel">
      <p class="eyebrow">Order summary</p>
      <h2 style="margin-top:12px;font-size:24px;font-weight:600;color:#07111f;font-family:'Sora',sans-serif">
        ${order.items.length} product${order.items.length === 1 ? "" : "s"}
      </h2>

      <div class="summary-items">
        ${itemsHtml}
      </div>

      <div class="summary-totals">
        <div class="summary-row"><span>Subtotal</span><span class="summary-row-value">${formatCurrency(Number(order.subtotal) || 0)}</span></div>
        <div class="summary-row"><span>Shipping</span><span class="summary-row-value">${Number(order.shipping) === 0 ? "Free" : formatCurrency(Number(order.shipping) || 0)}</span></div>
        <div class="summary-row"><span>Estimated tax</span><span class="summary-row-value">${formatCurrency(Number(order.tax) || 0)}</span></div>
        <div class="summary-total-row"><span>Total</span><span>${formatCurrency(Number(order.total) || 0)}</span></div>
      </div>

      <div class="receipt-footer" style="margin-top:24px">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>
        <p>Invoice generated for order ${order.order_number}.</p>
      </div>

      <p style="margin-top:16px;font-size:12px;line-height:1.5;color:#94a3b8">Save or print this summary for your records.</p>
    </div>
  </div>
</body>
</html>`);
  invoiceWindow.document.close();
}

function OrderCard({ order }) {
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const previewItems = order.items.slice(0, 3);

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Order number
          </p>
          <h3 className="mt-2 text-lg font-semibold text-brand-ink">{order.order_number}</h3>
          <p className="mt-2 text-sm text-slate-500">{formatOrderDate(order.created_at)}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getOrderStatusBadge(order.status)}`}
        >
          {formatStatusLabel(order.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Total
          </p>
          <p className="mt-2 text-base font-semibold text-brand-ink">
            {formatCurrency(Number(order.total) || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Items
          </p>
          <p className="mt-2 text-base font-semibold text-brand-ink">{itemCount}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Included products
        </p>
        <div className="mt-3 space-y-3">
          {previewItems.map((item) => (
            <div key={item.order_item_id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-ink">{item.product_name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Qty {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-brand-ink">
                {formatCurrency(Number(item.line_total) || 0)}
              </p>
            </div>
          ))}
        </div>
        {order.items.length > previewItems.length ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            +{order.items.length - previewItems.length} more products
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => handleDownloadInvoice(order)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-300/60 hover:text-brand-ink"
        >
          <Download className="h-3.5 w-3.5" />
          Download Invoice
        </button>
      </div>
    </article>
  );
}

function OrdersSection({ emptyMessage, orders, title }) {
  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-slate-50/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent">
            {title}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {orders.length > 0
              ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} in this section`
              : emptyMessage}
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-accent shadow-sm">
          <ReceiptText className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => <OrderCard key={order.order_id} order={order} />)
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white/90 px-4 py-5 text-sm leading-7 text-slate-600">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

export function OrdersPage() {
  const user = useStoredUser();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user?.user_id) {
      setOrders([]);
      setOrdersError("");
      setIsLoadingOrders(false);
      return;
    }

    let isActive = true;

    async function loadOrders() {
      setIsLoadingOrders(true);
      setOrdersError("");

      try {
        const response = await http.get("/orders", {
          params: { user_id: user.user_id },
        });

        if (!isActive) {
          return;
        }

        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setOrders([]);
        setOrdersError(getErrorMessage(error, "Unable to load order history right now."));
      } finally {
        if (isActive) {
          setIsLoadingOrders(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, [user?.user_id]);

  if (!user) {
    return (
      <StorefrontPageShell
        description="Sign in to review active orders, track confirmations, and browse your purchase history."
        eyebrow="Orders"
        title="You need to be signed in to track orders."
      >
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center shadow-[0_20px_60px_rgba(7,17,31,0.08)]">
          <p className="text-sm leading-7 text-slate-600">
            This page is reserved for signed-in shoppers. Return to the storefront or log
            in to review your orders.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Sign in
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-cyan-300/60 hover:text-brand-ink"
            >
              Back to home
            </Link>
          </div>
        </section>
      </StorefrontPageShell>
    );
  }

  const displayName = getUserDisplayName(user);
  const currentOrders = orders.filter((order) => !isPastOrderStatus(order.status));
  const pastOrders = orders.filter((order) => isPastOrderStatus(order.status));

  return (
    <StorefrontPageShell
      description="Track live order confirmations, review previous purchases, and keep every order number in one place."
      eyebrow="Orders"
      title={`${displayName}'s order tracking`}
    >
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(7,17,31,0.08)]">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-brand-accent">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
              Order tracking
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
              Current and past purchases on this account
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Confirmed orders appear here automatically after checkout and move into
              your order history as their status changes.
            </p>
          </div>
        </div>

        {ordersError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {ordersError}
          </div>
        ) : null}

        {isLoadingOrders ? (
          <div className="mt-6 flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-600">
            <LoaderCircle className="h-4 w-4 animate-spin text-brand-accent" />
            Loading your orders...
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <OrdersSection
              orders={currentOrders}
              title="Current orders"
              emptyMessage="Newly confirmed orders will appear here after checkout."
            />
            <OrdersSection
              orders={pastOrders}
              title="Past orders"
              emptyMessage="Completed or cancelled orders will move into this history section."
            />
          </div>
        )}
      </section>
    </StorefrontPageShell>
  );
}
