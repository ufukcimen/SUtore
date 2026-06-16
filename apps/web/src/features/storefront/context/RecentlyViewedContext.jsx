import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { ProductImageFrame, PriceBlock, SectionHeader } from "../components/RetailPrimitives";
import { getProductUrl, summarizeProduct } from "../utils/productPresentation";

const RECENTLY_VIEWED_STORAGE_KEY = "sutoreRecentlyViewedV1";
const MAX_RECENTLY_VIEWED = 8;

const RecentlyViewedContext = createContext(null);

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredProducts() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.map(summarizeProduct).filter(Boolean).slice(0, MAX_RECENTLY_VIEWED)
      : [];
  } catch {
    return [];
  }
}

function writeStoredProducts(products) {
  if (canUseStorage()) {
    window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(products));
  }
}

export function RecentlyViewedProvider({ children }) {
  const [items, setItems] = useState(readStoredProducts);

  useEffect(() => {
    writeStoredProducts(items);
  }, [items]);

  const recordProduct = useCallback((product) => {
    const summary = summarizeProduct(product);
    if (!summary) {
      return;
    }

    setItems((current) => [
      summary,
      ...current.filter((item) => String(item.id) !== String(summary.id)),
    ].slice(0, MAX_RECENTLY_VIEWED));
  }, []);

  const clearRecentlyViewed = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, recordProduct, clearRecentlyViewed }),
    [clearRecentlyViewed, items, recordProduct],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used inside RecentlyViewedProvider");
  }
  return context;
}

export function RecentlyViewedRail({ excludeId, className = "" }) {
  const { items } = useRecentlyViewed();
  const visibleItems = items.filter((item) => String(item.id) !== String(excludeId)).slice(0, 4);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Browsing history"
        title="Recently viewed"
        description="Jump back to products you inspected during this session."
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item) => (
          <Link
            key={item.id}
            to={getProductUrl(item)}
            className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
          >
            <ProductImageFrame src={item.image_url} alt={item.name} className="aspect-[5/4] p-3" />
            <div className="mt-3 flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 group-hover:text-cyan-700">
                  {item.name}
                </p>
                <div className="mt-2">
                  <PriceBlock product={item} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
