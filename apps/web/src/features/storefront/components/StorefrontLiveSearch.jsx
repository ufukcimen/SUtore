import { useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, LoaderCircle, Search } from "lucide-react";
import { StorefrontSearchForm } from "./StorefrontSearchForm";
import { normalizeSearchQuery, useProductSearch } from "../hooks/useProductSearch";

const categoryLabels = {
  accessory: "Gaming Accessories",
  audio: "Audio",
  component: "PC Components",
  desktop: "OEM PC's",
  laptop: "Laptops",
  monitor: "Monitors",
  network: "Network",
  peripheral: "Peripherals",
  storage: "Storage Devices",
  streaming: "Streaming Gear",
};

function formatPrice(price) {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

function getDropdownClassName(variant) {
  if (variant === "light") {
    return "absolute left-0 right-0 top-[calc(100%+0.85rem)] z-40 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_28px_60px_rgba(7,17,31,0.14)]";
  }

  return "absolute left-0 right-0 top-[calc(100%+0.85rem)] z-40 overflow-hidden rounded-[1.6rem] border border-slate-800 bg-slate-950 shadow-[0_28px_60px_rgba(2,6,23,0.45)]";
}

function getResultButtonClassName(variant, isActive) {
  if (variant === "light") {
    return `flex w-full items-start justify-between gap-4 rounded-[1.2rem] px-4 py-4 text-left transition ${
      isActive ? "bg-slate-100 ring-1 ring-cyan-300/60" : "hover:bg-slate-100"
    }`;
  }

  return `flex w-full items-start justify-between gap-4 rounded-[1.2rem] px-4 py-4 text-left transition ${
    isActive ? "bg-slate-800 ring-1 ring-cyan-300/40" : "hover:bg-slate-800"
  }`;
}

function getFooterButtonClassName(variant, isActive) {
  if (variant === "light") {
    return `flex w-full items-center justify-between rounded-[1.2rem] border bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-brand-ink transition ${
      isActive
        ? "border-cyan-300/70 text-brand-accent ring-1 ring-cyan-300/40"
        : "border-slate-200 hover:border-cyan-300/50 hover:text-brand-accent"
    }`;
  }

  return `flex w-full items-center justify-between rounded-[1.2rem] border bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition ${
    isActive
      ? "border-cyan-300/50 text-cyan-100 ring-1 ring-cyan-300/30"
      : "border-slate-800 hover:border-cyan-300/40 hover:bg-slate-800"
  }`;
}

export function StorefrontLiveSearch({
  className = "",
  placeholder = "Search products...",
  variant = "dark",
  syncWithSearchPage = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const { normalizedQuery, products, isLoading, errorMessage } = useProductSearch(query, {
    limit: 6,
  });
  const hasNavigableResults = !isLoading && !errorMessage && products.length > 0;
  const footerIndex = hasNavigableResults ? products.length : 0;
  const canNavigate = Boolean(normalizedQuery && !isLoading && !errorMessage);

  useEffect(() => {
    setActiveIndex(-1);
  }, [normalizedQuery, isLoading, errorMessage, products.length]);

  useEffect(() => {
    if (!syncWithSearchPage || location.pathname !== "/search") {
      return;
    }

    setQuery(searchParams.get("q") ?? "");
  }, [location.pathname, searchParams, syncWithSearchPage]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  function openSearchResults(nextQuery) {
    const resolvedQuery = normalizeSearchQuery(nextQuery);

    if (!resolvedQuery) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(resolvedQuery)}`);
  }

  function handleSubmit(event) {
    event.preventDefault();
    openSearchResults(query);
  }

  function handleSuggestionSelect(nextQuery) {
    setQuery(nextQuery);
    setIsOpen(false);
    openSearchResults(nextQuery);
  }

  function handleFooterSelect() {
    setIsOpen(false);
    openSearchResults(query);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!canNavigate) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => {
        const nextIndex = current + 1;
        return nextIndex > footerIndex ? 0 : nextIndex;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => {
        if (current === -1 || current === 0) {
          return footerIndex;
        }

        return current - 1;
      });
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex !== -1) {
      event.preventDefault();

      if (hasNavigableResults && activeIndex < products.length) {
        handleSuggestionSelect(products[activeIndex].name ?? "");
        return;
      }

      handleFooterSelect();
    }
  }

  const showDropdown = isOpen && normalizedQuery;
  const activeDescendant =
    activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <StorefrontSearchForm
        inputRef={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onSubmit={handleSubmit}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        variant={variant}
        inputProps={{
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-expanded": showDropdown,
          "aria-controls": showDropdown ? `${inputId}-listbox` : undefined,
          "aria-activedescendant": showDropdown ? activeDescendant : undefined,
        }}
      />

      {showDropdown ? (
        <div className={getDropdownClassName(variant)}>
          <div id={`${inputId}-listbox`} role="listbox" className="space-y-2 p-3">
            <div
              className={`flex items-center justify-between px-2 pt-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                variant === "light" ? "text-slate-500" : "text-cyan-200/80"
              }`}
            >
              <span>Live search</span>
              <span>{isLoading ? "Updating" : `${products.length} matches`}</span>
            </div>

            {isLoading ? (
              <div
                className={`flex items-center gap-3 rounded-[1.2rem] px-4 py-4 text-sm ${
                  variant === "light" ? "bg-slate-50 text-slate-600" : "bg-slate-900 text-slate-300"
                }`}
              >
                <LoaderCircle className="h-4 w-4 animate-spin text-brand-accent" />
                Searching the live catalog...
              </div>
            ) : null}

            {!isLoading && errorMessage ? (
              <div
                className={`rounded-[1.2rem] px-4 py-4 text-sm ${
                  variant === "light"
                    ? "border border-rose-200 bg-rose-50 text-rose-900"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-100"
                }`}
              >
                {errorMessage}
              </div>
            ) : null}

            {!isLoading && !errorMessage && products.length > 0 ? (
              products.map((product, index) => (
                <button
                  id={`${inputId}-option-${index}`}
                  key={product.product_id ?? product.name}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onClick={() => handleSuggestionSelect(product.name ?? "")}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={getResultButtonClassName(variant, activeIndex === index)}
                >
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${
                        variant === "light" ? "text-brand-ink" : "text-white"
                      }`}
                    >
                      {product.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {product.category ? (
                        <span
                          className={`rounded-full px-2 py-1 font-semibold ${
                            variant === "light"
                              ? "bg-cyan-50 text-brand-accent"
                              : "bg-cyan-400/10 text-cyan-100"
                          }`}
                        >
                          {categoryLabels[product.category] ?? product.category}
                        </span>
                      ) : null}
                      {product.model ? (
                        <span className={variant === "light" ? "text-slate-500" : "text-slate-400"}>
                          {product.model}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold ${
                      variant === "light"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    {formatPrice(product.price)}
                  </span>
                </button>
              ))
            ) : null}

            {!isLoading && !errorMessage && products.length === 0 ? (
              <div
                className={`rounded-[1.2rem] px-4 py-4 text-sm ${
                  variant === "light" ? "bg-slate-50 text-slate-600" : "bg-slate-900 text-slate-300"
                }`}
              >
                No instant matches found for "{normalizedQuery}".
              </div>
            ) : null}

            <button
              id={`${inputId}-option-${footerIndex}`}
              type="button"
              role="option"
              aria-selected={activeIndex === footerIndex}
              onClick={handleFooterSelect}
              onMouseEnter={() => setActiveIndex(footerIndex)}
              className={getFooterButtonClassName(variant, activeIndex === footerIndex)}
            >
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4 text-brand-accent" />
                View full search results
              </span>
              <ChevronRight className="h-4 w-4 text-brand-accent" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
