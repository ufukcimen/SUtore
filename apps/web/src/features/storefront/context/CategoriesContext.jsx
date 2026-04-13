import { createContext, useContext, useEffect, useState } from "react";
import { http } from "../../../lib/http";

const CategoriesContext = createContext({
  categories: [],
  isLoading: true,
});

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    http
      .get("/categories")
      .then((response) => {
        if (isActive) {
          setCategories(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch(() => {
        if (isActive) {
          setCategories([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, isLoading }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
