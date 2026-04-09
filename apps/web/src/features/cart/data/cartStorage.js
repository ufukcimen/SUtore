const CART_STORAGE_KEY = "sutoreCartItemsV2";
const LEGACY_CART_STORAGE_KEYS = ["sutoreCartItems"];

export const CART_UPDATED_EVENT = "sutore-cart-updated";
const MAX_CART_ITEM_QUANTITY = 10;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneCartItems(items) {
  return items.map((item) => ({ ...item }));
}

function clampQuantity(quantity) {
  return Math.min(Math.max(quantity, 1), MAX_CART_ITEM_QUANTITY);
}

function normalizeCategory(category) {
  return typeof category === "string" ? category.trim().toLowerCase() : "";
}

function getCartItemType(category) {
  switch (normalizeCategory(category)) {
    case "laptop":
      return "laptop";
    case "desktop":
      return "desktop";
    case "monitor":
      return "monitor";
    default:
      return "component";
  }
}

function getCartCategoryLabel(category) {
  switch (normalizeCategory(category)) {
    case "laptop":
      return "Laptop";
    case "desktop":
      return "OEM PC Build";
    case "monitor":
      return "Monitor";
    case "component":
      return "PC Component";
    default:
      return "Product";
  }
}

function getAvailabilityLabel(stockQuantity) {
  const quantity = Number(stockQuantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Out of stock";
  }

  if (quantity <= 5) {
    return "Low stock";
  }

  return "In stock";
}

function getShippingLabel(category, stockQuantity) {
  if (Number(stockQuantity) <= 0) {
    return "Unavailable for shipping";
  }

  switch (normalizeCategory(category)) {
    case "desktop":
    case "laptop":
      return "Ships in 2-4 business days";
    default:
      return "Ships within 24 hours";
  }
}

function getProductIdentifier(product) {
  return product?.id ?? product?.product_id ?? product?.serial_number ?? product?.name;
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

export function addProductToCart(product) {
  const productIdentifier = getProductIdentifier(product);

  if (!productIdentifier) {
    return [];
  }

  const existingItems = readCartItems();
  const cartItemId = `product-${productIdentifier}`;
  const existingItem = existingItems.find((item) => item.id === cartItemId);

  if (existingItem) {
    const nextItems = existingItems.map((item) =>
      item.id === cartItemId
        ? { ...item, quantity: clampQuantity(item.quantity + 1) }
        : item,
    );
    persistCartItems(nextItems);
    return nextItems;
  }

  const nextItems = [
    ...existingItems,
    {
      id: cartItemId,
      productId: productIdentifier,
      name: product?.name ?? "Unnamed product",
      category: getCartCategoryLabel(product?.category),
      availability: getAvailabilityLabel(product?.stock_quantity),
      variant: product?.model?.trim() || "Standard configuration",
      sku: product?.serial_number?.trim() || "N/A",
      shippingLabel: getShippingLabel(product?.category, product?.stock_quantity),
      type: getCartItemType(product?.category),
      quantity: 1,
      price: Number(product?.price) || 0,
      imageUrl: product?.image_url ?? "",
    },
  ];

  persistCartItems(nextItems);
  return nextItems;
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