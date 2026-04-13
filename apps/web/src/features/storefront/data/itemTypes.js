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
