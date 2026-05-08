import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Filter, RefreshCcw, X } from "lucide-react";
import { http } from "../../../lib/http";
import { ProductCard } from "./ProductCard";
import { StorefrontShell } from "./StorefrontShell";
import {
  PRICE_RANGES,
  parsePriceRange,
} from "../data/itemTypes";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
];

const EMPTY_FILTER_OPTIONS = {
  brands: [],
  cpus: [],
  gpus: [],
  ram_capacities: [],
  storage_capacities: [],
  discounted_count: 0,
};

const DEFAULT_OPEN_FILTER_SECTIONS = {
  type: true,
  price: true,
  discounted: true,
  brand: true,
  cpu: true,
  ram: true,
  gpu: true,
  storage: true,
};

function sortProducts(products, sortValue) {
  if (sortValue === "default") {
    return products;
  }

  const sorted = [...products];

  if (sortValue === "price_asc") {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
    return sorted;
  }

  if (sortValue === "price_desc") {
    sorted.sort((a, b) => Number(b.price) - Number(a.price));
    return sorted;
  }

  if (sortValue === "popularity") {
    // Backend returns the list already ordered by total units sold.
    return products;
  }

  return products;
}

function normalizeFilterOptions(data) {
  if (!data || typeof data !== "object") {
    return EMPTY_FILTER_OPTIONS;
  }

  return {
    brands: Array.isArray(data.brands) ? data.brands : [],
    cpus: Array.isArray(data.cpus) ? data.cpus : [],
    gpus: Array.isArray(data.gpus) ? data.gpus : [],
    ram_capacities: Array.isArray(data.ram_capacities) ? data.ram_capacities : [],
    storage_capacities: Array.isArray(data.storage_capacities) ? data.storage_capacities : [],
    discounted_count: Number(data.discounted_count) || 0,
  };
}

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function FilterSection({
  title,
  children,
  isVisible = true,
  isOpen = true,
  onToggle,
  selectedCount = 0,
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 py-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-brand-ink transition hover:text-brand-accent"
      >
        <span className="min-w-0 flex-1">{title}</span>
        {selectedCount > 0 ? (
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-brand-accent">
            {selectedCount}
          </span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  );
}

function CheckboxOption({ checked, label, count, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-accent focus:ring-cyan-200"
      />
      <span className="min-w-0 flex-1 break-words leading-5">{label}</span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-xs font-semibold text-slate-400">{count}</span>
      ) : null}
    </label>
  );
}

export function CategoryProductsPage({
  category,
  categoryId,
  badgeLabel,
  heading,
  loadingLabel,
  errorLabel,
  emptyLabel,
  Icon,
  itemTypes = [],
}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sortValue, setSortValue] = useState("default");
  const [selectedItemType, setSelectedItemType] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [isFiltersLoading, setIsFiltersLoading] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCpus, setSelectedCpus] = useState([]);
  const [selectedGpus, setSelectedGpus] = useState([]);
  const [selectedRamCapacities, setSelectedRamCapacities] = useState([]);
  const [selectedStorageCapacities, setSelectedStorageCapacities] = useState([]);
  const [discountedOnly, setDiscountedOnly] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState(DEFAULT_OPEN_FILTER_SECTIONS);

  const itemTypeOptions = itemTypes;
  const hasTypeFilters = itemTypeOptions.length > 0;
  const hasAdvancedFilterOptions =
    filterOptions.brands.length > 0 ||
    filterOptions.cpus.length > 0 ||
    filterOptions.gpus.length > 0 ||
    filterOptions.ram_capacities.length > 0 ||
    filterOptions.storage_capacities.length > 0 ||
    filterOptions.discounted_count > 0;
  const hasActiveFilters =
    selectedItemType !== "" ||
    selectedPriceRange !== "" ||
    selectedBrands.length > 0 ||
    selectedCpus.length > 0 ||
    selectedGpus.length > 0 ||
    selectedRamCapacities.length > 0 ||
    selectedStorageCapacities.length > 0 ||
    discountedOnly;

  const sortedProducts = useMemo(
    () => sortProducts(products, sortValue),
    [products, sortValue],
  );

  const baseFilterParams = useMemo(() => {
    const params = categoryId ? { category_id: categoryId } : { category };

    if (selectedItemType) {
      params.item_type = selectedItemType;
    }

    const { min, max } = parsePriceRange(selectedPriceRange);
    if (min !== null) {
      params.price_min = min;
    }
    if (max !== null) {
      params.price_max = max;
    }

    return params;
  }, [category, categoryId, selectedItemType, selectedPriceRange]);

  useEffect(() => {
    setSelectedItemType("");
    setSelectedPriceRange("");
    setSelectedBrands([]);
    setSelectedCpus([]);
    setSelectedGpus([]);
    setSelectedRamCapacities([]);
    setSelectedStorageCapacities([]);
    setDiscountedOnly(false);
  }, [category, categoryId]);

  useEffect(() => {
    let isActive = true;

    async function loadFilterOptions() {
      setIsFiltersLoading(true);

      try {
        const response = await http.get("/products/filters", { params: baseFilterParams });
        if (isActive) {
          setFilterOptions(normalizeFilterOptions(response.data));
        }
      } catch {
        if (isActive) {
          setFilterOptions(EMPTY_FILTER_OPTIONS);
        }
      } finally {
        if (isActive) {
          setIsFiltersLoading(false);
        }
      }
    }

    loadFilterOptions();

    return () => {
      isActive = false;
    };
  }, [baseFilterParams]);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = { ...baseFilterParams };

        if (sortValue === "popularity") {
          params.sort = "popularity";
        }
        if (selectedBrands.length > 0) {
          params.brand = selectedBrands.join(",");
        }
        if (selectedCpus.length > 0) {
          params.cpu = selectedCpus.join(",");
        }
        if (selectedGpus.length > 0) {
          params.gpu = selectedGpus.join(",");
        }
        if (selectedRamCapacities.length > 0) {
          params.ram_capacity_gb = selectedRamCapacities.join(",");
        }
        if (selectedStorageCapacities.length > 0) {
          params.storage_capacity_gb = selectedStorageCapacities.join(",");
        }
        if (discountedOnly) {
          params.discounted = true;
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

        const nextMessage =
          error instanceof Error
            ? error.message
            : "We could not load products right now.";

        setErrorMessage(nextMessage);
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
  }, [
    baseFilterParams,
    discountedOnly,
    selectedBrands,
    selectedCpus,
    selectedGpus,
    selectedRamCapacities,
    selectedStorageCapacities,
    sortValue,
  ]);

  function clearFilters() {
    setSelectedItemType("");
    setSelectedPriceRange("");
    setSelectedBrands([]);
    setSelectedCpus([]);
    setSelectedGpus([]);
    setSelectedRamCapacities([]);
    setSelectedStorageCapacities([]);
    setDiscountedOnly(false);
  }

  function toggleFilterSection(section) {
    setOpenFilterSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function renderOptionGroup(options, selectedValues, setSelectedValues) {
    return options.map((option) => (
      <CheckboxOption
        key={option.value}
        label={option.label}
        count={option.count}
        checked={selectedValues.includes(option.value)}
        onChange={() => setSelectedValues((current) => toggleValue(current, option.value))}
      />
    ));
  }

  function renderNumericOptionGroup(options, selectedValues, setSelectedValues) {
    return options.map((option) => (
      <CheckboxOption
        key={option.value}
        label={option.label}
        count={option.count}
        checked={selectedValues.includes(option.value)}
        onChange={() => setSelectedValues((current) => toggleValue(current, option.value))}
      />
    ));
  }

  return (
    <StorefrontShell>
      <header className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.08)] sm:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300/50 hover:text-brand-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to main page
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-accent">
              <Icon className="h-4 w-4" />
              {badgeLabel}
            </div>
            <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              {heading}
            </h1>
          </div>

          {!isLoading && !errorMessage ? (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm text-slate-700">
                <p className="font-semibold text-brand-ink">{products.length} products found</p>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value)}
                  className="w-full appearance-none rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 pr-10 text-sm font-semibold text-brand-ink shadow-sm transition hover:border-cyan-300/50 focus:border-cyan-300 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(7,17,31,0.06)] lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-brand-accent" />
            <p className="text-sm font-semibold text-brand-ink">Filters</p>
            {isFiltersLoading ? (
              <RefreshCcw className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" />
            ) : null}
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <FilterSection
              title="Type"
              isVisible={hasTypeFilters}
              isOpen={openFilterSections.type}
              onToggle={() => toggleFilterSection("type")}
              selectedCount={selectedItemType ? 1 : 0}
            >
              {itemTypeOptions.map((typeObj) => {
                const typeValue = typeof typeObj === "string" ? typeObj : typeObj.value;
                const typeLabel = typeof typeObj === "string" ? typeObj : typeObj.label;
                const isActive = selectedItemType === typeValue;

                return (
                  <CheckboxOption
                    key={typeValue}
                    label={typeLabel}
                    checked={isActive}
                    onChange={() => setSelectedItemType(isActive ? "" : typeValue)}
                  />
                );
              })}
            </FilterSection>

            <FilterSection
              title="Price"
              isOpen={openFilterSections.price}
              onToggle={() => toggleFilterSection("price")}
              selectedCount={selectedPriceRange ? 1 : 0}
            >
              <div className="relative">
                <select
                  value={selectedPriceRange}
                  onChange={(event) => setSelectedPriceRange(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm font-semibold text-brand-ink shadow-sm transition hover:border-cyan-300/50 focus:border-cyan-300 focus:outline-none"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </FilterSection>

            <FilterSection
              title="Discounted"
              isVisible={filterOptions.discounted_count > 0}
              isOpen={openFilterSections.discounted}
              onToggle={() => toggleFilterSection("discounted")}
              selectedCount={discountedOnly ? 1 : 0}
            >
              <CheckboxOption
                label="Discounted products"
                count={filterOptions.discounted_count}
                checked={discountedOnly}
                onChange={() => setDiscountedOnly((current) => !current)}
              />
            </FilterSection>

            <FilterSection
              title="Brand"
              isVisible={filterOptions.brands.length > 0}
              isOpen={openFilterSections.brand}
              onToggle={() => toggleFilterSection("brand")}
              selectedCount={selectedBrands.length}
            >
              {renderOptionGroup(filterOptions.brands, selectedBrands, setSelectedBrands)}
            </FilterSection>

            <FilterSection
              title="CPU"
              isVisible={filterOptions.cpus.length > 0}
              isOpen={openFilterSections.cpu}
              onToggle={() => toggleFilterSection("cpu")}
              selectedCount={selectedCpus.length}
            >
              {renderOptionGroup(filterOptions.cpus, selectedCpus, setSelectedCpus)}
            </FilterSection>

            <FilterSection
              title="RAM"
              isVisible={filterOptions.ram_capacities.length > 0}
              isOpen={openFilterSections.ram}
              onToggle={() => toggleFilterSection("ram")}
              selectedCount={selectedRamCapacities.length}
            >
              {renderNumericOptionGroup(
                filterOptions.ram_capacities,
                selectedRamCapacities,
                setSelectedRamCapacities,
              )}
            </FilterSection>

            <FilterSection
              title="GPU"
              isVisible={filterOptions.gpus.length > 0}
              isOpen={openFilterSections.gpu}
              onToggle={() => toggleFilterSection("gpu")}
              selectedCount={selectedGpus.length}
            >
              {renderOptionGroup(filterOptions.gpus, selectedGpus, setSelectedGpus)}
            </FilterSection>

            <FilterSection
              title="Storage"
              isVisible={filterOptions.storage_capacities.length > 0}
              isOpen={openFilterSections.storage}
              onToggle={() => toggleFilterSection("storage")}
              selectedCount={selectedStorageCapacities.length}
            >
              {renderNumericOptionGroup(
                filterOptions.storage_capacities,
                selectedStorageCapacities,
                setSelectedStorageCapacities,
              )}
            </FilterSection>

            {!hasTypeFilters && !hasAdvancedFilterOptions ? (
              <p className="border-t border-slate-200 pt-4 text-sm text-slate-500">
                No filters available.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0">
          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-brand-accent">
                <RefreshCcw className="h-6 w-6 animate-spin" />
              </div>
              <p className="mt-4 text-lg font-semibold text-brand-ink">{loadingLabel}</p>
              <p className="mt-2 text-sm text-slate-600">
                Fetching products from the backend catalog.
              </p>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold">{errorLabel}</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {!isLoading && !errorMessage ? (
            sortedProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id ?? product.product_id ?? product.name}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
                <p className="text-lg font-semibold text-brand-ink">
                  {hasActiveFilters ? "No products match your filters." : emptyLabel}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {hasActiveFilters
                    ? "Try adjusting your filters or clearing them to see all products."
                    : "The backend request completed successfully but returned no matching products right now."}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:border-cyan-300/50"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            )
          ) : null}
        </section>
      </div>
    </StorefrontShell>
  );
}
