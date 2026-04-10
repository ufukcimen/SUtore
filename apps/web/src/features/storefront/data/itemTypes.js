/**
 * Canonical item_type value -> user-facing label.
 * Keys must match the item_type column in the products table.
 */
export const ITEM_TYPE_LABELS = {
  // Core PC parts
  cpu: "Processor",
  gpu: "Graphics Card",
  motherboard: "Motherboard",
  ram: "RAM",
  ssd: "SSD",
  hdd: "HDD",
  power_supply: "Power Supply",
  case: "PC Case",
  cpu_cooler: "CPU Cooler",
  case_fan: "Case Fan",
  thermal_paste: "Thermal Paste",

  // Peripherals
  keyboard: "Keyboard",
  mouse: "Mouse",
  gaming_headset: "Gaming Headset",
  mousepad: "Mousepad",
  microphone: "Microphone",
  webcam: "Webcam",
  speakers: "Speakers",
  controller: "Controller",
  gaming_chair: "Gaming Chair",

  // Displays / other
  monitor: "Monitor",
  gaming_laptop: "Gaming Laptop",
};

/**
 * Maps the `category` value used by each category page to the
 * item_type values that should appear as filter chips on that page.
 */
export const CATEGORY_ITEM_TYPES = {
  component: [
    "cpu",
    "gpu",
    "motherboard",
    "ram",
    "power_supply",
    "case",
    "cpu_cooler",
    "case_fan",
    "thermal_paste",
  ],
  storage: ["ssd", "hdd"],
  peripheral: ["keyboard", "mouse"],
  accessory: ["keyboard", "mouse", "mousepad", "controller", "gaming_chair"],
  audio: ["gaming_headset", "microphone", "speakers"],
  monitor: ["monitor"],
  laptop: ["gaming_laptop"],
  desktop: [],
  network: [],
  streaming: ["webcam", "microphone"],
};

/**
 * Predefined price ranges for the price filter.
 */
export const PRICE_RANGES = [
  { value: "", label: "Any price" },
  { value: "0-50", label: "Under $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100-200", label: "$100 - $200" },
  { value: "200-400", label: "$200 - $400" },
  { value: "400-600", label: "$400 - $600" },
  { value: "600-", label: "$600+" },
];

/**
 * Parse a PRICE_RANGES value string into { min, max } numbers.
 * Returns nulls for open-ended boundaries.
 */
export function parsePriceRange(value) {
  if (!value) {
    return { min: null, max: null };
  }

  const [minStr, maxStr] = value.split("-");
  return {
    min: minStr ? Number(minStr) : null,
    max: maxStr ? Number(maxStr) : null,
  };
}
