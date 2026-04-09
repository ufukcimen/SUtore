const ORDER_CONFIRMATION_STORAGE_KEY = "sutoreOrderConfirmation";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function formatPlacedAt(date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function writeOrderConfirmation(order) {
  if (!canUseStorage()) {
    return null;
  }

  const placedAt = order?.created_at ? new Date(order.created_at) : new Date();
  const confirmation = {
    billingName: order?.billing_name?.trim() || "",
    billingEmail: order?.billing_email?.trim() || "",
    billingPhone: order?.billing_phone?.trim() || "",
    billingAddress: order?.billing_address?.trim() || "",
    items: (order?.items ?? []).map((item) => ({
      id: item.order_item_id ?? item.product_id ?? item.product_name,
      name: item.product_name,
      price: toNumber(item.unit_price),
      quantity: item.quantity,
      total: toNumber(item.line_total),
    })),
    orderNumber: order?.order_number || "",
    payment: {
      brand: order?.payment_brand || "Card",
      last4: order?.payment_last4 || "----",
    },
    placedAt: placedAt.toISOString(),
    placedAtLabel: formatPlacedAt(placedAt),
    summary: {
      subtotal: toNumber(order?.subtotal),
      shipping: toNumber(order?.shipping),
      tax: toNumber(order?.tax),
      total: toNumber(order?.total),
    },
  };

  window.sessionStorage.setItem(
    ORDER_CONFIRMATION_STORAGE_KEY,
    JSON.stringify(confirmation),
  );

  return confirmation;
}

export function readOrderConfirmation() {
  if (!canUseStorage()) {
    return null;
  }

  const storedConfirmation = window.sessionStorage.getItem(
    ORDER_CONFIRMATION_STORAGE_KEY,
  );
  if (!storedConfirmation) {
    return null;
  }

  try {
    return JSON.parse(storedConfirmation);
  } catch {
    return null;
  }
}
