import { describe, expect, it } from "vitest";
import { normalizeSearchQuery } from "./useProductSearch";

describe("normalizeSearchQuery", () => {
  it("trims leading and trailing whitespace from the search term", () => {
    expect(normalizeSearchQuery("   RTX 5090   ")).toBe("RTX 5090");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});
