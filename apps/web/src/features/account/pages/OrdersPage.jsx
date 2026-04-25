import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Download, LoaderCircle, ReceiptText, RotateCcw } from "lucide-react";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { formatCurrency } from "../../cart/data/cartStorage";
import { downloadResponseBlob } from "../../../lib/downloads";
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
  return ["completed", "delivered", "cancelled", "refunded", "refund_rejected"].includes(
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

  if (normalizedStatus === "in-transit") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-cyan-200 bg-cyan-50 text-brand-accent";
}

function formatStatusLabel(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  if (!normalizedStatus) {
    return "Pending";
  }

  const statusLabels = {
    confirmed: "Processing",
    processing: "Processing",
    "in-transit": "In-transit",
    delivered: "Delivered",
  };
  if (statusLabels[normalizedStatus]) {
    return statusLabels[normalizedStatus];
  }

  return normalizedStatus
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isRefundEligible(order) {
  const normalizedStatus = normalizeOrderStatus(order.status);
  if (["cancelled", "refunded", "refund_requested", "refund_rejected"].includes(normalizedStatus)) {
    return false;
  }

  const createdAt = order.created_at ? new Date(order.created_at) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const ageMs = Date.now() - createdAt.getTime();
  return ageMs >= 0 && ageMs <= 30 * 24 * 60 * 60 * 1000;
}

function OrderCard({ isDownloadingInvoice, isRefunding, onDownloadInvoice, onRequestRefund, order }) {
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

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {isRefundEligible(order) ? (
          <button
            type="button"
            disabled={isRefunding}
            onClick={() => onRequestRefund(order.order_id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-300/60 hover:text-brand-ink disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Request refund
          </button>
        ) : null}
        <button
          type="button"
          disabled={isDownloadingInvoice}
          onClick={() => onDownloadInvoice(order)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-300/60 hover:text-brand-ink disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {isDownloadingInvoice ? "Downloading..." : "Download Invoice"}
        </button>
      </div>
    </article>
  );
}

function OrdersSection({
  downloadActionId,
  emptyMessage,
  onDownloadInvoice,
  onRequestRefund,
  orders,
  refundActionId,
  title,
}) {
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
          orders.map((order) => (
            <OrderCard
              key={order.order_id}
              isDownloadingInvoice={downloadActionId === order.order_id}
              isRefunding={refundActionId === order.order_id}
              onDownloadInvoice={onDownloadInvoice}
              onRequestRefund={onRequestRefund}
              order={order}
            />
          ))
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
  const [refundActionId, setRefundActionId] = useState(null);
  const [downloadActionId, setDownloadActionId] = useState(null);

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

  async function handleRequestRefund(orderId) {
    if (!window.confirm("Send this order to the sales manager for refund review?")) return;

    setRefundActionId(orderId);
    setOrdersError("");

    try {
      const response = await http.patch(`/orders/${orderId}/refund-request`, null, {
        params: { user_id: user.user_id },
      });
      setOrders((prev) => prev.map((order) => (
        order.order_id === orderId ? response.data : order
      )));
    } catch (error) {
      setOrdersError(getErrorMessage(error, "Unable to request a refund for this order."));
    } finally {
      setRefundActionId(null);
    }
  }

  async function handleDownloadInvoice(order) {
    setDownloadActionId(order.order_id);
    setOrdersError("");

    try {
      const response = await http.get(`/orders/${order.order_id}/invoice/pdf`, {
        params: { user_id: user.user_id },
        responseType: "blob",
      });
      downloadResponseBlob(response, `invoice-${order.order_number}.pdf`);
    } catch (error) {
      setOrdersError(getErrorMessage(error, "Unable to download this invoice."));
    } finally {
      setDownloadActionId(null);
    }
  }

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
              downloadActionId={downloadActionId}
              orders={currentOrders}
              title="Current orders"
              emptyMessage="Newly confirmed orders will appear here after checkout."
              onDownloadInvoice={handleDownloadInvoice}
              onRequestRefund={handleRequestRefund}
              refundActionId={refundActionId}
            />
            <OrdersSection
              downloadActionId={downloadActionId}
              orders={pastOrders}
              title="Past orders"
              emptyMessage="Completed or cancelled orders will move into this history section."
              onDownloadInvoice={handleDownloadInvoice}
              onRequestRefund={handleRequestRefund}
              refundActionId={refundActionId}
            />
          </div>
        )}
      </section>
    </StorefrontPageShell>
  );
}
