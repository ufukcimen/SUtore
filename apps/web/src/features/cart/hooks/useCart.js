import { useCallback, useEffect, useRef, useState } from "react";
import {
  CART_UPDATED_EVENT,
  getCartItemCount,
  getCartSummary,
  readCartItems,
  reconcileCartItemsWithStock,
  writeCartItems,
} from "../data/cartStorage";
import { http } from "../../../lib/http";

function clampQuantity(quantity, stockQuantity) {
  const numericStock = Number(stockQuantity);
  const maxQuantity = Number.isFinite(numericStock)
    ? Math.min(Math.max(Math.floor(numericStock), 1), 10)
    : 10;

  return Math.min(Math.max(quantity, 1), maxQuantity);
}

async function fetchFreshProductsForItems(items) {
  const uniqueIds = Array.from(
    new Set(
      items
        .map((item) => Number(item.productId))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const results = await Promise.allSettled(
    uniqueIds.map((id) => http.get(`/products/${id}`)),
  );

  const freshProductsById = new Map();
  results.forEach((result, index) => {
    const id = uniqueIds[index];
    if (result.status === "fulfilled" && result.value?.data) {
      freshProductsById.set(id, result.value.data);
    } else if (result.status === "rejected" && result.reason?.response?.status === 404) {
      freshProductsById.set(id, null);
    }
  });
  return freshProductsById;
}

export function useCart() {
  const [items, setItems] = useState(() => readCartItems());
  const [stockChanges, setStockChanges] = useState([]);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function syncCart() {
      setItems(readCartItems());
    }

    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const refreshStock = useCallback(async () => {
    if (isRefreshingRef.current) return { changes: [] };
    const currentItems = readCartItems();
    if (currentItems.length === 0) return { changes: [] };

    isRefreshingRef.current = true;
    try {
      const freshProductsById = await fetchFreshProductsForItems(currentItems);
      if (freshProductsById.size === 0) return { changes: [] };

      const { items: reconciledItems, changes } = reconcileCartItemsWithStock(
        currentItems,
        freshProductsById,
      );

      if (changes.length > 0) {
        setItems(reconciledItems);
        writeCartItems(reconciledItems);
        setStockChanges(changes);
      }

      return { changes };
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshStock();
  }, [refreshStock]);

  function setNextItems(nextItems) {
    setItems(nextItems);
    writeCartItems(nextItems);
  }

  function updateQuantity(itemId, nextQuantity) {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            quantity: clampQuantity(nextQuantity, item.stockQuantity),
          }
        : item,
    );
    setNextItems(updatedItems);
  }

  function removeItem(itemId) {
    const nextItems = items.filter((item) => item.id !== itemId);
    setNextItems(nextItems);
  }

  function clearCart() {
    setNextItems([]);
  }

  function dismissStockChanges() {
    setStockChanges([]);
  }

  return {
    items,
    distinctItemCount: items.length,
    itemCount: getCartItemCount(items),
    summary: getCartSummary(items),
    stockChanges,
    refreshStock,
    dismissStockChanges,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
