import { it, expect } from "vitest";
import {
  identity,
  contentPack,
  creativeSVG,
  manualCandidate,
} from "./contentEngine";
it("deduplicates full Amazon URLs independent of affiliate tracking", () => {
  expect(identity("https://www.amazon.com/dp/B012345678?tag=first")).toBe(
    identity("https://amazon.com/gp/product/B012345678?tag=second"),
  );
  expect(() =>
    identity("https://amazon.com.evil.test/dp/B012345678"),
  ).toThrow();
});
it("uses verified facts, site destinations and exact creative dimensions", () => {
  const p = {
    id: "1",
    title: "Useful <find>",
    slug: "useful",
    category: "Tech",
    description: "Verified specification",
    tags: [],
  };
  const pack = contentPack([p], "https://example.com");
  expect(pack.website.key_features).toEqual([]);
  expect(pack.posts[0].destination_url).toBe("https://example.com/find/useful");
  expect(pack.posts[1].description).toContain("Amazon Associate");
  expect(creativeSVG(pack.posts[0], [p], "Single-product hero")).toContain(
    'width="1000" height="1500"',
  );
  expect(creativeSVG(pack.posts[1], [p], "List pin", "Cover")).toContain(
    'width="1080" height="1920"',
  );
  expect(creativeSVG(pack.posts[0], [p], "List pin")).not.toContain(
    "Useful <find>",
  );
});

it("imports link.amazon short links without changing tracking or casing", () => {
  const url = "https://link.amazon/B0hfb3Azq";
  const p = manualCandidate({
    title: "Tissue box cover",
    description: "Square tissue box cover.",
    category: "Home",
    affiliate_url: url,
  });
  expect(p.affiliate_url).toBe(url);
  expect(p.source_key).toBe("link.amazon/B0hfb3Azq");
  expect(p.published).toBe(false);
});
