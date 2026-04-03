import { detectCardBrand, digitsOnly } from "../utils/payment";

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

function buildOrderNumber() {
  return `SU-${Date.now().toString().slice(-8)}`;
}

export function writeOrderConfirmation({ form, items, summary }) {
  if (!canUseStorage()) {
    return null;
  }

  const placedAt = new Date();
  const cardBrand = detectCardBrand(form.cardNumber);
  const confirmation = {
    billingName: `${form.firstName} ${form.lastName}`.trim(),
    billingEmail: form.email.trim(),
    billingPhone: form.phone.trim(),
    billingAddress: [form.addressLine1, form.addressLine2, `${form.city}, ${form.stateRegion} ${form.postalCode}`, form.country]
      .filter(Boolean)
      .join(", "),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    })),
    orderNumber: buildOrderNumber(),
    payment: {
      brand: cardBrand?.label ?? "Card",
      last4: digitsOnly(form.cardNumber).slice(-4),
    },
    placedAt: placedAt.toISOString(),
    placedAtLabel: formatPlacedAt(placedAt),
    summary,
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
