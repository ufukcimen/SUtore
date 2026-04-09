import { useDeferredValue, useEffect, useState } from "react";
import { http } from "../../../lib/http";

export function normalizeSearchQuery(value) {
  return value.trim();
}

export function useProductSearch(query, { limit } = {}) {
  const normalizedQuery = normalizeSearchQuery(query);
  const deferredQuery = useDeferredValue(normalizedQuery);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      if (!deferredQuery) {
        setProducts([]);
        setErrorMessage("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = { search: deferredQuery };
        if (limit) {
          params.limit = limit;
        }

        const response = await http.get("/products", { params });

        if (!isActive) {
          return;
        }

        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setProducts([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We could not load search results right now.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [deferredQuery, limit]);

  return {
    normalizedQuery,
    deferredQuery,
    products,
    isLoading,
    errorMessage,
  };
}
