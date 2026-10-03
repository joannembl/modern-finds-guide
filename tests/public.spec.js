async function loadImages(page) {
  for (const image of await page.locator(".product-image img").all()) {
    await image.scrollIntoViewIfNeeded().catch(() => {});
    await image.evaluate((img) => img.decode().catch(() => {})).catch(() => {});
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}
import { test, expect } from "@playwright/test";
test("public collection, categories, search, details and unconfigured admin", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /Little finds/ }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "Search finds" }).fill("STANLEY");
  await expect(page.locator("#collection .product-card")).toHaveCount(1);
  await page
    .locator("#collection")
    .getByRole("button", { name: "Pets", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No finds match that search." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore all finds", exact: true })
    .click();
  await expect(page.locator("#collection .product-card")).toHaveCount(5);
  await page
    .locator("#collection .product-card")
    .first()
    .getByRole("link", { name: /The details/ })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /Expandable Drawer/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Check price on Amazon/ }),
  ).toHaveAttribute("rel", /sponsored/);
  await page.getByRole("link", { name: "Owner login" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your owner studio is ready to connect.",
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile layout fits screen and filtering works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await expect(page.locator("#categories")).toBeInViewport();
  await page.locator(".category-tile").filter({ hasText: "Tech" }).click();
  await expect(
    page.getByRole("heading", { name: "This corner of the guide is growing." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("./");
  await loadImages(page);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("desktop visual", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");
  await loadImages(page);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});

test("failed product images get a visible fallback", async ({ page }) => {
  await page.route("https://m.media-amazon.com/**", (route) => route.abort());
  await page.goto("./");
  await expect(
    page.locator(".featured-section .image-placeholder"),
  ).toHaveCount(3);
});
