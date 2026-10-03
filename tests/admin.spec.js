import { test, expect } from "@playwright/test";
test("owner login, draft create, edit, publish, feature, order and confirmed delete", async ({
  page,
}) => {
  let rows = [];
  let failSave = false;
  const id = "11111111-1111-4111-8111-111111111111";
  const user = {
    id,
    email: "owner@example.com",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const jwt = `e30.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
  await page.route("https://mfg-test.supabase.co/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    };
    let body = {};
    let status = 200;
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (url.pathname.endsWith("/token"))
      body = {
        access_token: jwt,
        refresh_token: "test-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      };
    else if (url.pathname.endsWith("/user")) body = user;
    else if (url.pathname.endsWith("/logout")) body = {};
    else if (url.pathname.includes("/admin_users")) body = { user_id: id };
    else if (url.pathname.includes("/products")) {
      if (method === "POST" || method === "PATCH") {
        if (failSave) {
          status = 409;
          body = { message: "Duplicate slug", code: "23505" };
        } else {
          const values = req.postDataJSON();
          const p = {
            ...values,
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          rows = [p];
          body = p;
        }
      } else if (method === "DELETE") {
        rows = [];
        body = { id };
      } else body = rows;
    }
    await route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5174/modern-finds-guide/admin");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: /Sign in to owner/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your collection starts here." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add a find +" }).click();
  await page.getByLabel("Product title").fill("Useful test find");
  await page
    .getByLabel("Short description")
    .fill("A useful draft for testing product management.");
  await page.getByLabel("Amazon affiliate URL").fill("https://amzn.to/test");
  await page.getByRole("button", { name: "Save find →" }).click();
  await expect(page.locator(".admin-list")).toContainText("Draft");
  expect(rows[0].published).toBe(false);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Product title").fill("Edited test find");
  await page.getByLabel("Category", { exact: true }).selectOption("Tech");
  await page.getByLabel("Sort order").fill("-5");
  await page.getByLabel("Featured on the homepage").check();
  await page.getByLabel("Published and visible").check();
  await page
    .getByLabel("Recommendation / practical notes")
    .fill("Check compatibility before buying.");
  failSave = true;
  await page.getByRole("button", { name: "Save find →" }).click();
  await expect(page.getByRole("alert")).toContainText("Duplicate slug");
  await expect(page.getByLabel("Product title")).toHaveValue(
    "Edited test find",
  );
  failSave = false;
  await page.getByRole("button", { name: "Save find →" }).click();
  await expect(page.locator(".admin-list")).toContainText("Published");
  await expect(page.locator(".admin-list")).toContainText("Featured");
  expect(rows[0]).toMatchObject({
    title: "Edited test find",
    sort_order: -5,
    category: "Tech",
    published: true,
    featured: true,
  });
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Keep product" }).click();
  expect(rows).toHaveLength(1);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete product" }).click();
  await expect(
    page.getByRole("heading", { name: "Your collection starts here." }),
  ).toBeVisible();
  expect(rows).toHaveLength(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Sign in to owner/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
