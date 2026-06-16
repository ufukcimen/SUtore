import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Check, Scale, X } from "lucide-react";
import { PriceBlock, ProductImageFrame, StockBadge } from "../components/RetailPrimitives";
import { getProductUrl, summarizeProduct } from "../utils/productPresentation";

const COMPARE_STORAGE_KEY = "sutoreCompareProductsV1";
const MAX_COMPARE_PRODUCTS = 4;

const CompareContext = createContext(null);

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredCompareProducts() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.map(summarizeProduct).filter(Boolean).slice(0, MAX_COMPARE_PRODUCTS)
      : [];
  } catch {
    return [];
  }
}

function writeStoredCompareProducts(products) {
  if (canUseStorage()) {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(products));
  }
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(readStoredCompareProducts);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    writeStoredCompareProducts(items);
  }, [items]);

  const isCompared = useCallback(
    (product) => {
      const summary = summarizeProduct(product);
      return Boolean(summary && items.some((item) => String(item.id) === String(summary.id)));
    },
    [items],
  );

  const addToCompare = useCallback((product) => {
    const summary = summarizeProduct(product);
    if (!summary) {
      return { ok: false, reason: "invalid" };
    }

    let result = { ok: true, reason: "added" };
    setItems((current) => {
      if (current.some((item) => String(item.id) === String(summary.id))) {
        result = { ok: true, reason: "exists" };
        return current;
      }

      if (current.length >= MAX_COMPARE_PRODUCTS) {
        result = { ok: false, reason: "limit" };
        return current;
      }

      return [...current, summary];
    });
    return result;
  }, []);

  const removeFromCompare = useCallback((productOrId) => {
    const id = typeof productOrId === "object" ? summarizeProduct(productOrId)?.id : productOrId;
    setItems((current) => current.filter((item) => String(item.id) !== String(id)));
  }, []);

  const toggleCompare = useCallback((product) => {
    if (isCompared(product)) {
      removeFromCompare(product);
      return { ok: true, reason: "removed" };
    }
    return addToCompare(product);
  }, [addToCompare, isCompared, removeFromCompare]);

  const clearCompare = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      isDrawerOpen,
      setIsDrawerOpen,
      isCompared,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearCompare,
      maxItems: MAX_COMPARE_PRODUCTS,
    }),
    [addToCompare, clearCompare, isCompared, isDrawerOpen, items, removeFromCompare, toggleCompare],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }
  return context;
}

export function CompareToggle({ product, className = "", compact = false }) {
  const { isCompared, toggleCompare } = useCompare();
  const compared = isCompared(product);

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    toggleCompare(product);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
        compared
          ? "border-cyan-300 bg-cyan-50 text-cyan-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
      } ${className}`}
      aria-pressed={compared}
      aria-label={compared ? "Remove from compare" : "Add to compare"}
    >
      {compared ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      {compact ? null : compared ? "Comparing" : "Compare"}
    </button>
  );
}

export function CompareTray() {
  const { items, setIsDrawerOpen, clearCompare, removeFromCompare } = useCompare();

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              <BarChart3 className="h-4 w-4 text-cyan-700" />
              Compare {items.length}/4
            </span>
            {items.map((item) => (
              <span
                key={item.id}
                className="inline-flex max-w-[14rem] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-xs font-semibold text-slate-700"
              >
                <span className="truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  aria-label={`Remove ${item.name} from compare`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View compared products
            </button>
          </div>
        </div>
      </div>
      <CompareDrawer />
    </>
  );
}

export function CompareDrawer() {
  const { items, isDrawerOpen, setIsDrawerOpen, removeFromCompare, clearCompare } = useCompare();

  if (!isDrawerOpen) {
    return null;
  }

  const rows = [
    ["Category", (item) => item.category || "Product"],
    ["Type", (item) => item.item_type || "Standard"],
    ["Model", (item) => item.model || "Not listed"],
    ["RAM", (item) => item.ram_capacity_gb ? `${item.ram_capacity_gb}GB` : "Not listed"],
    ["Storage", (item) => item.storage_capacity_gb ? `${item.storage_capacity_gb}GB` : "Not listed"],
    ["Warranty", (item) => item.warranty_status ? "Covered" : "Not listed"],
    ["Distributor", (item) => item.distributor || "Not listed"],
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
              Product compare
            </p>
            <h2 className="text-xl font-semibold text-slate-950">Compare selected products</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Close compare drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
              Add products from listing cards or product pages to compare their details here.
            </div>
          ) : (
            <div className="min-w-[720px]">
              <div className="grid gap-3" style={{ gridTemplateColumns: `10rem repeat(${items.length}, minmax(12rem, 1fr))` }}>
                <div />
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <ProductImageFrame
                      src={item.image_url}
                      alt={item.name}
                      className="aspect-[5/4] p-3"
                    />
                    <Link
                      to={getProductUrl(item)}
                      onClick={() => setIsDrawerOpen(false)}
                      className="mt-3 block text-sm font-semibold leading-5 text-slate-950 hover:text-cyan-700"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriceBlock product={item} />
                      <button
                        type="button"
                        onClick={() => removeFromCompare(item.id)}
                        className="rounded-md p-2 text-slate-400 transition hover:bg-slate-50 hover:text-rose-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Stock
                </div>
                {items.map((item) => (
                  <div key={`${item.id}-stock`} className="rounded-md border border-slate-200 px-3 py-2">
                    <StockBadge product={item} />
                  </div>
                ))}

                {rows.map(([label, getValue]) => (
                  <div key={label} className="contents">
                    <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                      {label}
                    </div>
                    {items.map((item) => (
                      <div key={`${item.id}-${label}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        {getValue(item)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={clearCompare}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
          >
            Clear compare
          </button>
        </div>
      </div>
    </div>
  );
}
