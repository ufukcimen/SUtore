export const FALLBACK_CATEGORIES = [
  {
    category_id: "fallback-pc-components",
    name: "component",
    slug: "pc-components",
    label: "PC Components",
    description: "Core parts for upgrades, repairs, and new custom builds.",
    icon: "cpu",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: true,
    item_types: [],
  },
  {
    category_id: "fallback-laptops",
    name: "laptop",
    slug: "laptops",
    label: "Laptops",
    description: "Portable gaming, creator, and work-ready systems.",
    icon: "laptop",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: true,
    item_types: [],
  },
  {
    category_id: "fallback-monitors",
    name: "monitor",
    slug: "monitors",
    label: "Monitors",
    description: "Displays for gaming, productivity, and content creation.",
    icon: "monitor",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: true,
    item_types: [],
  },
  {
    category_id: "fallback-oem-pcs",
    name: "desktop",
    slug: "oem-pcs",
    label: "OEM PCs",
    description: "Ready-made desktop systems for fast checkout.",
    icon: "sparkles",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: false,
    item_types: [],
  },
  {
    category_id: "fallback-storage",
    name: "storage",
    slug: "storage-devices",
    label: "Storage Devices",
    description: "SSDs, HDDs, and high-capacity upgrade storage.",
    icon: "hard-drive",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: true,
    item_types: [],
  },
  {
    category_id: "fallback-peripherals",
    name: "peripheral",
    slug: "peripherals",
    label: "Peripherals",
    description: "Keyboards, mice, and desk accessories.",
    icon: "keyboard",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: false,
    item_types: [],
  },
  {
    category_id: "fallback-gaming-accessories",
    name: "accessory",
    slug: "gaming-accessories",
    label: "Gaming Accessories",
    description: "Controllers, extras, and gaming setup add-ons.",
    icon: "gamepad2",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: false,
    item_types: [],
  },
  {
    category_id: "fallback-audio",
    name: "audio",
    slug: "audio",
    label: "Audio",
    description: "Headsets, speakers, and sound gear.",
    icon: "headphones",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: false,
    item_types: [],
  },
  {
    category_id: "fallback-network",
    name: "network",
    slug: "network",
    label: "Network",
    description: "Routers, adapters, and connectivity hardware.",
    icon: "router",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: false,
    item_types: [],
  },
  {
    category_id: "fallback-streaming",
    name: "streaming",
    slug: "streaming-gear",
    label: "Streaming Gear",
    description: "Microphones, capture gear, and creator tools.",
    icon: "mic2",
    is_visible_in_sidebar: true,
    is_visible_on_homepage: false,
    item_types: [],
  },
];

export function getDisplayCategories(categories) {
  return categories.length > 0 ? categories : FALLBACK_CATEGORIES;
}

const HOMEPAGE_CATEGORY_SLUGS = [
  "pc-components",
  "laptops",
  "monitors",
  "storage-devices",
];

export function getHomepageCategories(categories) {
  const displayCategories = getDisplayCategories(categories);
  const categoriesBySlug = new Map(
    displayCategories
      .filter((category) => category?.slug)
      .map((category) => [category.slug, category]),
  );

  return HOMEPAGE_CATEGORY_SLUGS.map((slug) => {
    const category = categoriesBySlug.get(slug);
    if (category) {
      return category;
    }
    const fallbackCategory = FALLBACK_CATEGORIES.find((category) => category.slug === slug);
    return fallbackCategory ?? null;
  }).filter(Boolean);
}

export function resolveFallbackCategory(slug) {
  return FALLBACK_CATEGORIES.find((category) => category.slug === slug) ?? null;
}
