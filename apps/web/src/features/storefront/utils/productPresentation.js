export function formatPrice(price) {
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

export function getDiscount(product) {
  return Number(product?.discount_percent) || 0;
}

export function getOriginalPrice(product) {
  return Number(product?.price) || 0;
}

export function getEffectivePrice(product) {
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscount(product);
  return discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
}

export function getProductId(product) {
  return product?.product_id ?? product?.id ?? product?.serial_number ?? product?.name;
}

export function getStockQuantity(product) {
  const stockQuantity = Number(product?.stock_quantity);
  return Number.isFinite(stockQuantity) ? Math.max(Math.floor(stockQuantity), 0) : 0;
}

export function getStockLabel(product) {
  const quantity = getStockQuantity(product);

  if (quantity <= 0) {
    return "Out of stock";
  }

  if (quantity === 1) {
    return "1 left";
  }

  return `${quantity} in stock`;
}

export function getStockTone(product) {
  const quantity = getStockQuantity(product);

  if (quantity <= 0) {
    return "danger";
  }

  if (quantity <= 5) {
    return "warning";
  }

  return "success";
}

export function getProductUrl(product) {
  return `/products/${getProductId(product)}`;
}

export function formatLabel(value) {
  return String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bPc\b/g, "PC")
    .replace(/\bOem\b/g, "OEM")
    .replace(/\bSsd\b/g, "SSD")
    .replace(/\bHdd\b/g, "HDD")
    .replace(/\bRam\b/g, "RAM")
    .replace(/\bGpu\b/g, "GPU")
    .replace(/\bCpu\b/g, "CPU");
}

export function formatItemTypeLabel(value) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  const labels = {
    cpu: "Processor",
    gpu: "Graphics Card",
    ram: "Memory",
    ssd: "SSD",
    hdd: "HDD",
    psu: "Power Supply",
    "power supply": "Power Supply",
    motherboard: "Motherboard",
    monitor: "Monitor",
    desktop: "Desktop",
    laptop: "Laptop",
    keyboard: "Keyboard",
    mouse: "Mouse",
    headset: "Headset",
  };

  return labels[normalized] ?? formatLabel(value);
}

function normalizeSpec(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
}

function addUniqueSpec(specs, value) {
  const label = String(value ?? "").trim();
  if (!label) {
    return;
  }

  const normalized = normalizeSpec(label);
  if (!normalized || specs.some((item) => normalizeSpec(item) === normalized)) {
    return;
  }

  specs.push(label);
}

function formatCapacityGb(value, unitLabel) {
  const capacity = Number(value);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return "";
  }

  if (capacity >= 1024) {
    return `${Number((capacity / 1024).toFixed(capacity % 1024 === 0 ? 0 : 1))}TB ${unitLabel}`;
  }

  return `${capacity}GB ${unitLabel}`;
}

function getProductText(product) {
  return [
    product?.name,
    product?.model,
    product?.item_type,
    product?.category,
    product?.description,
  ]
    .filter(Boolean)
    .join(" ");
}

export function getProductSpecHighlights(product) {
  const specs = [];
  const itemType = normalizeSpec(product?.item_type);
  const text = getProductText(product);
  const normalizedText = normalizeSpec(text);
  const model = String(product?.model ?? "").trim();

  addUniqueSpec(specs, formatCapacityGb(product?.ram_capacity_gb, "RAM"));
  addUniqueSpec(specs, formatCapacityGb(product?.storage_capacity_gb, "storage"));

  if (itemType === "gpu") {
    const memoryMatch = text.match(/\b(\d{1,2})\s*gb\b/i);
    addUniqueSpec(specs, memoryMatch ? `${memoryMatch[1]}GB graphics memory` : "");
    addUniqueSpec(specs, /\boc\b|overclock/i.test(text) ? "Factory OC" : "");
    addUniqueSpec(specs, /rtx\s?\d{4}/i.exec(text)?.[0]?.toUpperCase());
  }

  if (itemType === "cpu") {
    addUniqueSpec(specs, /x3d/i.test(text) ? "3D V-Cache" : "");
    addUniqueSpec(specs, /ryzen\s?[3579]/i.exec(text)?.[0]);
    addUniqueSpec(specs, /core\s?i[3579]/i.exec(text)?.[0]);
  }

  if (itemType === "ssd" || itemType === "hdd" || normalizedText.includes("storage")) {
    addUniqueSpec(specs, normalizedText.includes("nvme") ? "NVMe storage" : "");
    addUniqueSpec(specs, itemType === "ssd" ? "Solid state drive" : "");
  }

  if (itemType === "monitor") {
    addUniqueSpec(specs, /\b\d{2}\s?(?:inch|")/i.exec(text)?.[0]?.replace("inch", "\""));
    addUniqueSpec(specs, /\b\d{3,4}\s?hz\b/i.exec(text)?.[0]?.toUpperCase());
  }

  if (itemType === "ram") {
    addUniqueSpec(specs, /ddr[45]/i.exec(text)?.[0]?.toUpperCase());
    addUniqueSpec(specs, /rgb/i.test(text) ? "RGB lighting" : "");
  }

  if (model && specs.length < 2) {
    addUniqueSpec(specs, `Model ${model}`);
  }

  addUniqueSpec(specs, product?.warranty_status ? "Warranty covered" : "");

  return specs.slice(0, 4);
}

export function getProductImageTreatment(product) {
  const itemType = normalizeSpec(product?.item_type);

  if (itemType === "ssd" || itemType === "ram") {
    return {
      frameClassName: "bg-slate-50 p-3",
      imageClassName: "max-h-[82%] w-[96%]",
    };
  }

  if (itemType === "cpu") {
    return {
      frameClassName: "bg-slate-50 p-3",
      imageClassName: "max-h-[90%] max-w-[90%]",
    };
  }

  if (itemType === "gpu" || itemType === "graphics card") {
    return {
      frameClassName: "bg-slate-50 p-3",
      imageClassName: "max-h-[88%] max-w-[94%]",
    };
  }

  if (itemType === "monitor" || itemType === "laptop") {
    return {
      frameClassName: "bg-slate-50 p-4",
      imageClassName: "max-h-[92%] max-w-[92%]",
    };
  }

  return {
    frameClassName: "bg-slate-50",
    imageClassName: "",
  };
}

export function summarizeProduct(product) {
  if (!product) {
    return null;
  }

  const id = getProductId(product);
  if (!id) {
    return null;
  }

  return {
    id,
    product_id: product.product_id ?? product.id ?? id,
    name: product.name ?? "Unnamed product",
    image_url: product.image_url ?? "",
    category: product.category ?? "",
    item_type: product.item_type ?? "",
    model: product.model ?? "",
    price: product.price ?? 0,
    discount_percent: getDiscount(product),
    stock_quantity: product.stock_quantity ?? 0,
    warranty_status: Boolean(product.warranty_status),
    distributor: product.distributor ?? "",
    ram_capacity_gb: product.ram_capacity_gb ?? null,
    storage_capacity_gb: product.storage_capacity_gb ?? null,
    description: product.description ?? "",
  };
}
