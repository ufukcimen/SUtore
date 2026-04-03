import { useEffect, useState } from "react";
import {
  CART_UPDATED_EVENT,
  getCartItemCount,
  getCartSummary,
  readCartItems,
  writeCartItems,
} from "../data/cartStorage";

function clampQuantity(quantity) {
  return Math.min(Math.max(quantity, 1), 10);
}

export function useCart() {
  const [items, setItems] = useState(() => readCartItems());

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

  function setNextItems(nextItems) {
    setItems(nextItems);
    writeCartItems(nextItems);
  }

  function updateQuantity(itemId, nextQuantity) {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, quantity: clampQuantity(nextQuantity) } : item,
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

  return {
    items,
    itemCount: getCartItemCount(items),
    summary: getCartSummary(items),
    updateQuantity,
    removeItem,
    clearCart,
  };
}
