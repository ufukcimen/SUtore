import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  Check,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  Power,
  RefreshCcw,
  ShoppingCart,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { http } from "../../../lib/http";
import { addProductToCart, formatCurrency } from "../../cart/data/cartStorage";
import { StorefrontShell } from "../components/StorefrontShell";
import { useCategories } from "../context/CategoriesContext";

const COMPONENT_SLOTS = [
  {
    id: "cpu",
    label: "Processor",
    shortLabel: "CPU",
    Icon: Cpu,
    required: true,
    serialPrefixes: ["CPU"],
    matchTypes: ["cpu", "processor"],
    keywords: [/intel core/i, /amd ryzen/i, /\bcore i[3579]\b/i, /\bryzen [3579]\b/i],
  },
  {
    id: "motherboard",
    label: "Motherboard",
    shortLabel: "Board",
    Icon: CircuitBoard,
    required: true,
    serialPrefixes: ["MB"],
    matchTypes: ["motherboard", "mainboard"],
    keywords: [/motherboard/i, /\bb650\b/i, /\bb760\b/i, /\bx670\b/i, /\bz790\b/i, /\blga1700\b/i, /\bam5\b/i],
  },
  {
    id: "memory",
    label: "Memory",
    shortLabel: "RAM",
    Icon: MemoryStick,
    required: true,
    serialPrefixes: ["RAM"],
    matchTypes: ["ram", "memory"],
    keywords: [/\bddd?r[45]\b/i, /memory kit/i, /vengeance/i, /fury/i, /t-force/i],
  },
  {
    id: "storage",
    label: "Storage",
    shortLabel: "SSD/HDD",
    Icon: HardDrive,
    required: true,
    serialPrefixes: ["SSD", "HDD"],
    matchTypes: ["ssd", "hdd", "storage", "nvme"],
    keywords: [/\bnvme\b/i, /\bssd\b/i, /\bhdd\b/i, /hard drive/i, /990 pro/i, /sn850x/i],
  },
  {
    id: "gpu",
    label: "Graphics Card",
    shortLabel: "GPU",
    Icon: Monitor,
    required: true,
    serialPrefixes: ["GPU"],
    matchTypes: ["gpu", "graphics_card", "graphics card", "video_card"],
    keywords: [/geforce/i, /radeon/i, /\brtx\b/i, /\brx 7/i, /graphics card/i],
  },
  {
    id: "psu",
    label: "Power Supply",
    shortLabel: "PSU",
    Icon: Power,
    required: true,
    serialPrefixes: ["PSU"],
    matchTypes: ["psu", "power_supply", "power supply"],
    keywords: [/power supply/i, /\b[6-9][0-9]{2}w\b/i, /80\+ (gold|bronze|platinum)/i],
  },
  {
    id: "case",
    label: "Case",
    shortLabel: "Case",
    Icon: Box,
    required: true,
    serialPrefixes: ["CASE"],
    matchTypes: ["case", "pc_case", "computer case"],
    keywords: [/mid-tower/i, /tower case/i, /\bcase\b/i, /h5 flow/i],
  },
  {
    id: "cooling",
    label: "CPU Cooling",
    shortLabel: "Cooler",
    Icon: Fan,
    required: true,
    serialPrefixes: ["COL"],
    matchTypes: ["cooler", "cpu_cooler", "liquid_cooler", "air_cooler"],
    keywords: [/cpu cooler/i, /liquid cooler/i, /air cooler/i, /freezer/i, /ak620/i, /h100i/i],
  },
  {
    id: "fans",
    label: "Case Fans",
    shortLabel: "Fans",
    Icon: Zap,
    required: false,
    serialPrefixes: ["FAN"],
    matchTypes: ["fan", "case_fan", "case fans"],
    keywords: [/fan pack/i, /\bfan\b/i],
  },
];

const EMPTY_SELECTIONS = Object.fromEntries(COMPONENT_SLOTS.map((slot) => [slot.id, ""]));
const BUILD_COMPONENT_CATEGORIES = new Set([
  "component",
  "components",
  "pc component",
  "pc components",
  "cpu",
  "processor",
  "gpu",
  "graphics card",
  "motherboard",
  "mainboard",
  "ram",
  "memory",
  "storage",
  "ssd",
  "hdd",
  "psu",
  "power supply",
  "case",
  "pc case",
  "cooler",
  "cpu cooler",
  "fan",
]);

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function getProductId(product) {
  return product?.product_id ?? product?.id ?? product?.serial_number ?? product?.name;
}

function getProductText(product) {
  return [
    product?.item_type,
    product?.category,
    product?.serial_number,
    product?.name,
    product?.model,
    product?.description,
  ]
    .filter(Boolean)
    .join(" ");
}

function getEffectivePrice(product) {
  const price = Number(product?.price) || 0;
  const discount = Number(product?.discount_percent) || 0;
  return discount > 0 ? price * (1 - discount / 100) : price;
}

function getStockQuantity(product) {
  const quantity = Number(product?.stock_quantity);
  return Number.isFinite(quantity) ? Math.max(Math.floor(quantity), 0) : 0;
}

function isAvailable(product) {
  return getStockQuantity(product) > 0;
}

function getStockLabel(product) {
  const quantity = getStockQuantity(product);

  if (quantity <= 0) {
    return "Out of stock";
  }

  if (quantity === 1) {
    return "1 left";
  }

  return `${quantity} left`;
}

function productMatchesSlot(product, slot) {
  const itemType = normalizeText(product?.item_type);
  const category = normalizeText(product?.category);
  const serial = normalizeText(product?.serial_number);
  const text = getProductText(product);

  if (
    slot.matchTypes.some((type) => itemType === normalizeText(type) || category === normalizeText(type))
  ) {
    return true;
  }

  if (slot.serialPrefixes.some((prefix) => serial.startsWith(normalizeText(prefix)))) {
    return true;
  }

  return slot.keywords.some((pattern) => pattern.test(text));
}

function isBuildComponentCandidate(product) {
  const itemType = normalizeText(product?.item_type);
  const category = normalizeText(product?.category);
  const serial = normalizeText(product?.serial_number);

  if (BUILD_COMPONENT_CATEGORIES.has(category) || BUILD_COMPONENT_CATEGORIES.has(itemType)) {
    return true;
  }

  if (
    COMPONENT_SLOTS.some((slot) =>
      slot.matchTypes.some((type) => itemType === normalizeText(type) || category === normalizeText(type)),
    )
  ) {
    return true;
  }

  if (
    COMPONENT_SLOTS.some((slot) =>
      slot.serialPrefixes.some((prefix) => serial.startsWith(normalizeText(prefix))),
    )
  ) {
    return true;
  }

  return !category && !itemType;
}

function getSlotForProduct(product) {
  if (!isBuildComponentCandidate(product)) {
    return null;
  }

  return COMPONENT_SLOTS.find((slot) => productMatchesSlot(product, slot)) ?? null;
}

function uniqueProducts(products) {
  const seen = new Set();
  const result = [];

  products.forEach((product) => {
    const id = getProductId(product);
    if (!id || seen.has(String(id))) {
      return;
    }

    seen.add(String(id));
    result.push(product);
  });

  return result;
}

function sortProductsForSlot(products) {
  return [...products].sort((a, b) => {
    const aAvailable = isAvailable(a) ? 0 : 1;
    const bAvailable = isAvailable(b) ? 0 : 1;

    if (aAvailable !== bAvailable) {
      return aAvailable - bAvailable;
    }

    return getEffectivePrice(a) - getEffectivePrice(b);
  });
}

function findComponentCategory(categories) {
  return categories.find((category) => {
    const name = normalizeText(category.name);
    const slug = normalizeText(category.slug);
    const label = normalizeText(category.label);

    return (
      name === "component" ||
      slug === "pc components" ||
      label.includes("pc component") ||
      label.includes("component")
    );
  });
}

function getCpuPlatform(product) {
  const text = normalizeText(getProductText(product));

  if (!text) {
    return "";
  }

  if (text.includes("amd ryzen") || text.includes("am5")) {
    return "AMD AM5";
  }

  if (text.includes("intel core") || text.includes("lga1700") || text.includes("14th gen")) {
    return "Intel LGA1700";
  }

  return "";
}

function getMotherboardPlatform(product) {
  const text = normalizeText(getProductText(product));

  if (!text) {
    return "";
  }

  if (text.includes("am5") || text.includes("b650") || text.includes("x670")) {
    return "AMD AM5";
  }

  if (text.includes("lga1700") || text.includes("b760") || text.includes("z790")) {
    return "Intel LGA1700";
  }

  return "";
}

function getPsuWattage(product) {
  const text = getProductText(product);
  const match = text.match(/\b([6-9][0-9]{2}|1[0-2][0-9]{2})\s*w\b/i);
  return match ? Number(match[1]) : 0;
}

function getGpuPowerClass(product) {
  const text = normalizeText(getProductText(product));

  if (text.includes("4070") || text.includes("7800 xt")) {
    return 650;
  }

  if (text.includes("7700 xt") || text.includes("4060")) {
    return 550;
  }

  return 0;
}

function getStockClassName(product) {
  const quantity = getStockQuantity(product);

  if (quantity <= 0) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (quantity <= 5) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function ComponentTypeButton({ count, isActive, isSelected, onClick, slot }) {
  const Icon = slot.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[5rem] min-w-0 items-center gap-3 rounded-[1.25rem] border p-3 text-left transition ${
        isActive
          ? "border-cyan-300 bg-cyan-50 text-brand-ink shadow-[0_14px_34px_rgba(8,145,178,0.12)]"
          : "border-slate-200 bg-white/85 text-slate-700 hover:border-cyan-300/50 hover:bg-white"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
          isActive ? "bg-cyan-100 text-brand-accent" : "bg-slate-50 text-slate-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{slot.shortLabel}</span>
          {isSelected ? (
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-500">{slot.label}</span>
        <span className="mt-1 block text-xs font-semibold text-brand-accent">
          {count} {count === 1 ? "product" : "products"}
        </span>
      </span>
    </button>
  );
}

function ComponentProductCard({ isSelected, onSelect, product, slot }) {
  const productUrl = `/products/${product.product_id ?? product.id}`;
  const discount = Number(product.discount_percent) || 0;
  const hasDiscount = discount > 0;
  const originalPrice = Number(product.price) || 0;
  const effectivePrice = getEffectivePrice(product);
  const outOfStock = !isAvailable(product);

  return (
    <article
      className={`overflow-hidden rounded-[1.75rem] border bg-white/85 shadow-[0_18px_45px_rgba(7,17,31,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(7,17,31,0.12)] ${
        isSelected ? "border-cyan-300 ring-2 ring-cyan-200/70" : "border-slate-200/80"
      }`}
    >
      <Link to={productUrl} className="relative block">
        <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_48%,#fff7ed_100%)]">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
              Image unavailable
            </div>
          )}
        </div>

        {hasDiscount ? (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{discount}%
          </span>
        ) : null}

        {isSelected ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <Check className="h-3.5 w-3.5" />
            Selected
          </span>
        ) : null}
      </Link>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col items-start justify-between gap-3 min-[420px]:flex-row min-[420px]:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
              {slot.label}
            </p>
            <Link to={productUrl} className="block">
              <h2 className="mt-2 break-words text-lg font-semibold text-brand-ink transition hover:text-brand-accent sm:text-xl">
                {product.name}
              </h2>
            </Link>
          </div>
          <div className="shrink-0 rounded-2xl bg-cyan-50 px-3 py-2 text-left min-[420px]:text-right">
            {hasDiscount ? (
              <>
                <p className="text-xs text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </p>
                <p className="text-sm font-semibold text-brand-accent">
                  {formatCurrency(effectivePrice)}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-brand-accent">
                {formatCurrency(originalPrice)}
              </p>
            )}
          </div>
        </div>

        <p className="line-clamp-4 text-sm leading-6 text-slate-600">
          {product.description || "Description not available."}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStockClassName(product)}`}
          >
            {getStockLabel(product)}
          </span>
          {hasDiscount ? (
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              {discount}% OFF
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSelect}
          disabled={outOfStock}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto ${
            outOfStock
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : isSelected
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-brand-accent text-brand-ink hover:bg-brand-glow"
          }`}
        >
          {outOfStock ? (
            "Out of stock"
          ) : isSelected ? (
            <>
              <Check className="h-4 w-4" />
              Selected for build
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Select part
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function CompatibilityPanel({ selectedBySlot }) {
  const cpuPlatform = getCpuPlatform(selectedBySlot.cpu);
  const motherboardPlatform = getMotherboardPlatform(selectedBySlot.motherboard);
  const psuWattage = getPsuWattage(selectedBySlot.psu);
  const gpuPowerClass = getGpuPowerClass(selectedBySlot.gpu);
  const platformMismatch =
    cpuPlatform && motherboardPlatform && cpuPlatform !== motherboardPlatform;
  const psuMismatch = psuWattage > 0 && gpuPowerClass > 0 && psuWattage < gpuPowerClass;

  const checks = [
    {
      id: "platform",
      label: "CPU and motherboard platform",
      ok: !platformMismatch,
      detail:
        cpuPlatform && motherboardPlatform
          ? `${cpuPlatform} CPU with ${motherboardPlatform} board`
          : "Select CPU and motherboard",
    },
    {
      id: "power",
      label: "Power supply headroom",
      ok: !psuMismatch,
      detail:
        psuWattage && gpuPowerClass
          ? `${psuWattage}W selected, ${gpuPowerClass}W recommended`
          : "Select GPU and power supply",
    },
  ];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-accent" />
        <p className="text-sm font-semibold text-brand-ink">Compatibility</p>
      </div>

      <div className="mt-4 space-y-3">
        {checks.map((check) => (
          <div key={check.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                check.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {check.ok ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-ink">{check.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomPcCreatorPage() {
  const { categories } = useCategories();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState(EMPTY_SELECTIONS);
  const [isAdded, setIsAdded] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState(COMPONENT_SLOTS[0].id);

  const componentCategory = useMemo(() => findComponentCategory(categories), [categories]);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage("");

      const requests = [
        http.get("/products", { params: { category: "component", limit: 100 } }),
        http.get("/products", { params: { limit: 100 } }),
      ];

      if (componentCategory?.category_id) {
        requests.unshift(
          http.get("/products", {
            params: { category_id: componentCategory.category_id, limit: 100 },
          }),
        );
      }

      try {
        const responses = await Promise.allSettled(requests);

        if (!isActive) {
          return;
        }

        const fulfilledProducts = responses.flatMap((response) =>
          response.status === "fulfilled" && Array.isArray(response.value.data)
            ? response.value.data
            : [],
        );
        const groupedProducts = uniqueProducts(fulfilledProducts).filter((product) =>
          Boolean(getSlotForProduct(product)),
        );

        setProducts(groupedProducts);

        if (groupedProducts.length === 0 && responses.every((response) => response.status === "rejected")) {
          setErrorMessage("We could not load products right now.");
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "We could not load products right now.",
          );
        }
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
  }, [componentCategory?.category_id]);

  const productsBySlot = useMemo(() => {
    const grouped = Object.fromEntries(COMPONENT_SLOTS.map((slot) => [slot.id, []]));

    products.forEach((product) => {
      const slot = getSlotForProduct(product);
      if (slot) {
        grouped[slot.id].push(product);
      }
    });

    COMPONENT_SLOTS.forEach((slot) => {
      grouped[slot.id] = sortProductsForSlot(grouped[slot.id]);
    });

    return grouped;
  }, [products]);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      map.set(String(getProductId(product)), product);
    });
    return map;
  }, [products]);

  const selectedBySlot = useMemo(() => {
    return Object.fromEntries(
      COMPONENT_SLOTS.map((slot) => [slot.id, productById.get(String(selectedIds[slot.id])) ?? null]),
    );
  }, [productById, selectedIds]);

  const activeSlot = COMPONENT_SLOTS.find((slot) => slot.id === activeSlotId) ?? COMPONENT_SLOTS[0];
  const activeProducts = productsBySlot[activeSlot.id] ?? [];
  const selectedProducts = COMPONENT_SLOTS.map((slot) => selectedBySlot[slot.id]).filter(Boolean);
  const selectedRequiredCount = COMPONENT_SLOTS.filter(
    (slot) => slot.required && selectedBySlot[slot.id],
  ).length;
  const requiredSlots = COMPONENT_SLOTS.filter((slot) => slot.required);
  const isBuildComplete = selectedRequiredCount === requiredSlots.length;
  const subtotal = selectedProducts.reduce((sum, product) => sum + getEffectivePrice(product), 0);
  const hasUnavailableSelection = selectedProducts.some((product) => !isAvailable(product));

  function handleSelect(slotId, productId) {
    setSelectedIds((current) => ({
      ...current,
      [slotId]: productId,
    }));
    setIsAdded(false);
  }

  function handleClearBuild() {
    setSelectedIds(EMPTY_SELECTIONS);
    setIsAdded(false);
  }

  function handleAddBuildToCart() {
    if (!isBuildComplete || hasUnavailableSelection) {
      return;
    }

    selectedProducts.forEach((product) => addProductToCart(product));
    setIsAdded(true);
  }

  return (
    <StorefrontShell mainClassName="max-w-[90rem]">
      <header className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_80px_rgba(7,17,31,0.08)] sm:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300/50 hover:text-brand-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to main page
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-accent">
              <Cpu className="h-4 w-4" />
              Custom PC Creator
            </div>
            <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Build a custom PC from live catalog components.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Pick one part for each build category, review the total, and move the selected
              components into your cart together.
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
                Required
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand-ink">
                {selectedRequiredCount}/{requiredSlots.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
                Parts
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand-ink">{selectedProducts.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand-ink">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div className="min-w-0 space-y-5">
          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-brand-accent">
                <RefreshCcw className="h-6 w-6 animate-spin" />
              </div>
              <p className="mt-4 text-lg font-semibold text-brand-ink">Loading build components...</p>
              <p className="mt-2 text-sm text-slate-600">Fetching available parts from the catalog.</p>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
              <p className="text-lg font-semibold">We could not load custom PC parts.</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {!isLoading && !errorMessage ? (
            <>
              {products.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-10 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
                  <p className="text-lg font-semibold text-brand-ink">No build components found.</p>
                  <p className="mt-2 text-sm text-slate-600">
                    The catalog loaded successfully but did not return products that match PC build slots.
                  </p>
                </div>
              ) : (
                <>
                  <section className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(7,17,31,0.06)] sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                          Component type
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
                          Choose a category to browse parts.
                        </h2>
                      </div>
                      <p className="text-sm text-slate-500">
                        One selected product is saved for each component type.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {COMPONENT_SLOTS.map((slot) => (
                        <ComponentTypeButton
                          key={slot.id}
                          slot={slot}
                          count={productsBySlot[slot.id]?.length ?? 0}
                          isActive={activeSlot.id === slot.id}
                          isSelected={Boolean(selectedBySlot[slot.id])}
                          onClick={() => setActiveSlotId(slot.id)}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_45px_rgba(7,17,31,0.06)] sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-brand-accent">
                          <activeSlot.Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="break-words text-2xl font-semibold text-brand-ink">
                              {activeSlot.label}
                            </h2>
                            {activeSlot.required ? (
                              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-brand-accent">
                                Required
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {activeProducts.length} {activeProducts.length === 1 ? "product" : "products"} available.
                          </p>
                        </div>
                      </div>

                      {selectedBySlot[activeSlot.id] ? (
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
                          <span className="font-semibold text-brand-ink">Selected:</span>{" "}
                          {selectedBySlot[activeSlot.id].name}
                        </div>
                      ) : null}
                    </div>

                    {activeProducts.length > 0 ? (
                      <div className="mt-6 grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                        {activeProducts.map((product) => {
                          const id = String(getProductId(product));

                          return (
                            <ComponentProductCard
                              key={id}
                              slot={activeSlot}
                              product={product}
                              isSelected={String(selectedIds[activeSlot.id]) === id}
                              onSelect={() => handleSelect(activeSlot.id, id)}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white/85 px-6 py-10 text-center">
                        <p className="text-lg font-semibold text-brand-ink">
                          No {activeSlot.label.toLowerCase()} products found.
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Try another component type or add matching products to the catalog.
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          ) : null}
        </div>

        <aside className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_28px_80px_rgba(7,17,31,0.08)] xl:sticky xl:top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-accent">
                Build summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
                {formatCurrency(subtotal)}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClearBuild}
              disabled={selectedProducts.length === 0}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Clear build"
              title="Clear build"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {COMPONENT_SLOTS.map((slot) => {
              const selectedProduct = selectedBySlot[slot.id];
              const Icon = slot.Icon;

              return (
                <div
                  key={slot.id}
                  className={`flex items-start gap-3 rounded-[1.25rem] border p-3 ${
                    selectedProduct
                      ? "border-cyan-100 bg-cyan-50/50"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      selectedProduct ? "bg-cyan-100 text-brand-accent" : "bg-white text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-ink">{slot.shortLabel}</p>
                      {slot.required ? (
                        <span className="text-xs font-semibold text-slate-400">required</span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {selectedProduct ? selectedProduct.name : "Not selected"}
                    </p>
                  </div>
                  {selectedProduct ? (
                    <p className="shrink-0 text-sm font-semibold text-brand-accent">
                      {formatCurrency(getEffectivePrice(selectedProduct))}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <CompatibilityPanel selectedBySlot={selectedBySlot} />
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
            {!isBuildComplete ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Select the required parts to complete the build.
              </p>
            ) : null}

            {hasUnavailableSelection ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Replace out-of-stock parts before adding this build to the cart.
              </p>
            ) : null}

            {isAdded ? (
              <Link
                to="/cart"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200"
              >
                <Check className="h-4 w-4" />
                Review cart
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAddBuildToCart}
                disabled={!isBuildComplete || hasUnavailableSelection}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <ShoppingCart className="h-4 w-4" />
                Add build to cart
              </button>
            )}
          </div>
        </aside>
      </div>
    </StorefrontShell>
  );
}
