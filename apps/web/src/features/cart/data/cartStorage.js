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

function getStockLimit(stockQuantity) {
  const numericStock = Number(stockQuantity);

  if (!Number.isFinite(numericStock)) {
    return MAX_CART_ITEM_QUANTITY;
  }

  return Math.min(Math.max(Math.floor(numericStock), 0), MAX_CART_ITEM_QUANTITY);
}

function clampQuantity(quantity, stockQuantity) {
  const stockLimit = getStockLimit(stockQuantity);
  const maxQuantity = stockLimit > 0 ? stockLimit : MAX_CART_ITEM_QUANTITY;

  return Math.min(Math.max(quantity, 1), maxQuantity);
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
    case "storage":
      return "storage";
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
    case "accessory":
      return "Accessory";
    case "storage":
      return "Storage";
    case "network":
      return "Network";
    case "peripheral":
      return "Peripheral";
    case "audio":
      return "Audio";
    case "streaming":
      return "Streaming Gear";
    default:
      return "Product";
  }
}

function getAvailabilityLabel(stockQuantity) {
  const quantity = Number(stockQuantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Out of stock";
  }

  if (quantity === 1) {
    return "1 left in stock";
  }

  if (quantity <= 5) {
    return `${quantity} left in stock`;
  }

  return `${quantity} in stock`;
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

function getDiscountedPrice(product) {
  const price = Number(product?.price) || 0;
  const discount = Number(product?.discount_percent) || 0;
  if (discount > 0 && discount <= 100) {
    return Math.round(price * (1 - discount / 100) * 100) / 100;
  }
  return price;
}

function buildCartItem(product, productIdentifier, quantity) {
  const effectivePrice = getDiscountedPrice(product);
  const originalPrice = Number(product?.price) || 0;
  const discount = Number(product?.discount_percent) || 0;
  return {
    id: `product-${productIdentifier}`,
    productId: productIdentifier,
    name: product?.name ?? "Unnamed product",
    category: getCartCategoryLabel(product?.category),
    availability: getAvailabilityLabel(product?.stock_quantity),
    variant: product?.model?.trim() || "Standard configuration",
    sku: product?.serial_number?.trim() || "N/A",
    shippingLabel: getShippingLabel(product?.category, product?.stock_quantity),
    stockQuantity: getStockLimit(product?.stock_quantity),
    type: getCartItemType(product?.category),
    quantity,
    price: effectivePrice,
    originalPrice: discount > 0 ? originalPrice : null,
    discountPercent: discount > 0 ? discount : 0,
    imageUrl: product?.image_url ?? "",
  };
}

function sanitizeNonNegativeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function sanitizePositiveInteger(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.floor(numeric);
  return integer >= 1 ? integer : null;
}

function sanitizeStringField(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function sanitizeCartItem(rawItem) {
  if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
    return null;
  }

  const productId = rawItem.productId ?? rawItem.product_id;
  if (productId == null || productId === "") {
    return null;
  }

  const price = sanitizeNonNegativeNumber(rawItem.price);
  if (price === null) {
    return null;
  }

  const stockQuantityRaw = sanitizeNonNegativeNumber(rawItem.stockQuantity);
  const stockQuantity =
    stockQuantityRaw === null
      ? MAX_CART_ITEM_QUANTITY
      : Math.min(Math.floor(stockQuantityRaw), MAX_CART_ITEM_QUANTITY);

  const quantityCandidate = sanitizePositiveInteger(rawItem.quantity);
  if (quantityCandidate === null) {
    return null;
  }
  const quantityCap = stockQuantity > 0 ? stockQuantity : MAX_CART_ITEM_QUANTITY;
  const quantity = Math.min(quantityCandidate, quantityCap);

  const originalPrice = sanitizeNonNegativeNumber(rawItem.originalPrice);
  const discountPercent = sanitizeNonNegativeNumber(rawItem.discountPercent) ?? 0;

  const id = sanitizeStringField(rawItem.id, `product-${productId}`);

  return {
    ...rawItem,
    id,
    productId,
    name: sanitizeStringField(rawItem.name, "Unnamed product"),
    category: sanitizeStringField(rawItem.category, "Product"),
    availability: sanitizeStringField(rawItem.availability, ""),
    variant: sanitizeStringField(rawItem.variant, "Standard configuration"),
    sku: sanitizeStringField(rawItem.sku, "N/A"),
    shippingLabel: sanitizeStringField(rawItem.shippingLabel, ""),
    type: sanitizeStringField(rawItem.type, "component"),
    imageUrl: typeof rawItem.imageUrl === "string" ? rawItem.imageUrl : "",
    price,
    originalPrice: originalPrice !== null && originalPrice > 0 ? originalPrice : null,
    discountPercent: Math.min(Math.max(Math.floor(discountPercent), 0), 100),
    stockQuantity,
    quantity,
  };
}

export function sanitizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  const sanitized = [];
  for (const rawItem of rawItems) {
    const item = sanitizeCartItem(rawItem);
    if (item) sanitized.push(item);
  }
  return sanitized;
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
    if (!Array.isArray(parsedCart)) return [];
    const sanitized = sanitizeCartItems(parsedCart);
    if (sanitized.length !== parsedCart.length) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return cloneCartItems(sanitized);
  } catch {
    return [];
  }
}

export function writeCartItems(items) {
  persistCartItems(items);
}

export function addProductToCart(product) {
  const productIdentifier = getProductIdentifier(product);
  const availableStock = getStockLimit(product?.stock_quantity);

  if (!productIdentifier) {
    return [];
  }

  if (availableStock <= 0) {
    return readCartItems();
  }

  const existingItems = readCartItems();
  const cartItemId = `product-${productIdentifier}`;
  const existingItem = existingItems.find((item) => item.id === cartItemId);

  if (existingItem) {
    const nextItems = existingItems.map((item) =>
      item.id === cartItemId
        ? buildCartItem(
            product,
            productIdentifier,
            clampQuantity(item.quantity + 1, product?.stock_quantity),
          )
        : item,
    );
    persistCartItems(nextItems);
    return nextItems;
  }

  const nextItems = [
    ...existingItems,
    buildCartItem(product, productIdentifier, 1),
  ];

  persistCartItems(nextItems);
  return nextItems;
}

function getFreshProductForItem(item, freshProductsById) {
  const candidateKeys = [item.productId, item.id?.replace?.("product-", "")];
  for (const key of candidateKeys) {
    if (key == null) continue;
    const direct = freshProductsById.get(key);
    if (direct) return direct;
    const numeric = Number(key);
    if (Number.isFinite(numeric)) {
      const numericMatch = freshProductsById.get(numeric);
      if (numericMatch) return numericMatch;
    }
    const stringMatch = freshProductsById.get(String(key));
    if (stringMatch) return stringMatch;
  }
  return null;
}

export function reconcileCartItemsWithStock(items, freshProductsById) {
  const nextItems = [];
  const changes = [];

  items.forEach((item) => {
    const fresh = getFreshProductForItem(item, freshProductsById);

    if (!fresh) {
      changes.push({ type: "removed", name: item.name, reason: "missing" });
      return;
    }

    const freshStock = getStockLimit(fresh.stock_quantity);

    if (freshStock <= 0) {
      changes.push({ type: "removed", name: item.name, reason: "out_of_stock" });
      return;
    }

    const previousQuantity = item.quantity;
    const clampedQuantity = clampQuantity(previousQuantity, fresh.stock_quantity);
    const stockChanged = freshStock !== Number(item.stockQuantity);
    const quantityChanged = clampedQuantity !== previousQuantity;

    if (!stockChanged && !quantityChanged) {
      nextItems.push(item);
      return;
    }

    nextItems.push({
      ...item,
      quantity: clampedQuantity,
      stockQuantity: freshStock,
      availability: getAvailabilityLabel(fresh.stock_quantity),
      shippingLabel: getShippingLabel(fresh.category ?? item.category, fresh.stock_quantity),
    });

    if (quantityChanged) {
      changes.push({
        type: "quantity_reduced",
        name: item.name,
        previousQuantity,
        nextQuantity: clampedQuantity,
      });
    } else if (stockChanged) {
      changes.push({ type: "stock_updated", name: item.name });
    }
  });

  return { items: nextItems, changes };
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
