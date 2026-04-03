const CART_STORAGE_KEY = "sutoreCartItemsV2";
const LEGACY_CART_STORAGE_KEYS = ["sutoreCartItems"];

export const CART_UPDATED_EVENT = "sutore-cart-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneCartItems(items) {
  return items.map((item) => ({ ...item }));
}

function clearLegacyCartStorage() {
  if (!canUseStorage()) {
    return;
  }

  LEGACY_CART_STORAGE_KEYS.forEach((legacyKey) => {
    if (legacyKey !== CART_STORAGE_KEY) {
      window.localStorage.removeItem(legacyKey);
    }
  });
}

function persistCartItems(items) {
  if (!canUseStorage()) {
    return;
  }

  clearLegacyCartStorage();
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function readCartItems() {
  if (!canUseStorage()) {
    return [];
  }

  clearLegacyCartStorage();
  const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!storedCart) {
    return [];
  }

  try {
    const parsedCart = JSON.parse(storedCart);
    return Array.isArray(parsedCart) ? cloneCartItems(parsedCart) : [];
  } catch {
    return [];
  }
}

export function writeCartItems(items) {
  persistCartItems(items);
}

export function getCartItemCount(items) {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function getCartSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartSummary(items) {
  const subtotal = getCartSubtotal(items);
  const shipping = items.length === 0 ? 0 : subtotal >= 1200 ? 0 : 24.9;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
