import { describe, it, expect } from "vitest";
import {
  filterProducts,
  safeUrl,
  seedProducts,
  validateProduct,
} from "./catalog";
describe("catalog behavior", () => {
  it("never includes drafts, even when searching their title", () => {
    const draft = { ...seedProducts[0], published: false };
    expect(filterProducts([draft], "all", draft.title)).toEqual([]);
  });
  it("combines category and case-insensitive tag search", () => {
    expect(filterProducts(seedProducts, "Home", "EVERYDAY CARRY")).toHaveLength(
      1,
    );
    expect(filterProducts(seedProducts, "Tech", "EVERYDAY CARRY")).toHaveLength(
      0,
    );
  });
  it("orders by guide order and name", () => {
    const reversed = [...seedProducts].reverse();
    expect(filterProducts(reversed, "all", "")[0].id).toBe("1");
    expect(filterProducts(reversed, "all", "", "az")[0].title).toMatch(
      /^Clear/,
    );
  });
  it("rejects deceptive affiliate URLs and non-HTTPS images", () => {
    [
      "javascript:alert(1)",
      "https://amazon.com.evil.test/item",
      "https://evilamazon.com/item",
      "http://amzn.to/a",
      "https://amzn.to@evil.test/a",
    ].forEach((url) => expect(safeUrl(url, true)).toBe(false));
    expect(safeUrl("https://www.amazon.com/dp/ABC?tag=owner", true)).toBe(true);
    expect(safeUrl("https://amzn.to/abc", true)).toBe(true);
  });
  it("validates editable product fields", () => {
    expect(validateProduct(seedProducts[0])).toBe("");
    expect(validateProduct({ ...seedProducts[0], slug: "Bad Slug" })).toContain(
      "slug",
    );
    expect(validateProduct({ ...seedProducts[0], sort_order: 1.5 })).toContain(
      "whole",
    );
  });
});
