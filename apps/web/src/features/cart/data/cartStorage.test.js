import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addProductToCart,
  getCartItemCount,
  getCartSummary,
  readCartItems,
} from "./cartStorage";
import { cleanupMockBrowser, installMockBrowser } from "../../../test/browserMocks";

const gpuProduct = {
  product_id: 5090,
  name: "GeForce RTX 5090",
  model: "Founders Edition",
  serial_number: "RTX5090-FE",
  price: 1999.99,
  stock_quantity: 2,
  category: "component",
};

describe("cartStorage", () => {
  beforeEach(() => {
    installMockBrowser();
  });

  afterEach(() => {
    cleanupMockBrowser();
  });

  it("merges repeated adds into one cart row and caps quantity at stock", () => {
    addProductToCart(gpuProduct);
    addProductToCart(gpuProduct);
    const itemsAfterThirdAdd = addProductToCart(gpuProduct);

    expect(itemsAfterThirdAdd).toHaveLength(1);
    expect(itemsAfterThirdAdd[0].quantity).toBe(2);
    expect(itemsAfterThirdAdd[0].name).toBe("GeForce RTX 5090");
    expect(getCartItemCount(itemsAfterThirdAdd)).toBe(2);
  });

  it("does not add out-of-stock products", () => {
    const items = addProductToCart({
      ...gpuProduct,
      product_id: 7001,
      stock_quantity: 0,
    });

    expect(items).toEqual([]);
    expect(readCartItems()).toEqual([]);
  });

  it("applies shipping only below the free-shipping threshold", () => {
    const belowThreshold = getCartSummary([{ price: 999.99, quantity: 1 }]);
    const aboveThreshold = getCartSummary([{ price: 1200, quantity: 1 }]);

    expect(belowThreshold.shipping).toBe(24.9);
    expect(aboveThreshold.shipping).toBe(0);
  });

  it("stores discounted price details when a product is on sale", () => {
    const [item] = addProductToCart({
      ...gpuProduct,
      product_id: 6000,
      price: 1000,
      discount_percent: 25,
      stock_quantity: 4,
    });

    expect(item.price).toBe(750);
    expect(item.originalPrice).toBe(1000);
    expect(item.discountPercent).toBe(25);
  });
});
