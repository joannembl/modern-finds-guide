import { it, expect } from "vitest";
import {
  reviewedPayload,
  pinterestPayload,
  dispatchReviewed,
} from "../server/publishing";
const post = {
  platform: "Pinterest",
  status: "Approved",
  title: "Find",
  description: "Verified copy",
  alt_text: "Editorial creative",
  destination_url: "https://example.com/find/test",
};
const assets = [
  {
    platform: "Pinterest",
    format: "Pinterest",
    status: "Approved",
    public_url: "https://example.com/test.png",
  },
];
it("publishing boundary rejects unapproved content and unhosted assets", () => {
  expect(() => reviewedPayload({ ...post, status: "Draft" }, assets)).toThrow();
  expect(() =>
    reviewedPayload(post, [{ ...assets[0], public_url: null }]),
  ).toThrow();
  expect(() =>
    reviewedPayload(
      { ...post, status: "Scheduled", scheduled_at: "2100-01-01" },
      assets,
    ),
  ).toThrow();
  expect(
    pinterestPayload(reviewedPayload(post, assets), "board").media_source.url,
  ).toBe(assets[0].public_url);
});
it("unconfigured connector returns manual fallback without a publish attempt", async () => {
  expect((await dispatchReviewed(post, assets, {})).mode).toBe("manual");
  await expect(
    dispatchReviewed(post, assets, {
      Pinterest: { publish: async () => ({}) },
    }),
  ).rejects.toThrow("confirm");
});
