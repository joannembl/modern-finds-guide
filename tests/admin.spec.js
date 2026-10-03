import { test, expect } from "@playwright/test";
test("owner login, draft create, edit, publish, feature, order and confirmed delete", async ({
  page,
}) => {
  let rows = [];
  let queue = [],
    posts = [],
    media = [];
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
    else if (url.pathname.includes("/rpc/create_content_pack")) {
      const values = req.postDataJSON();
      queue = [
        {
          id: "queue-id",
          product_id: id,
          product_ids: [id],
          status: "Draft",
          website: values.pack.website,
        },
      ];
      posts = values.pack.posts.map((p, i) => ({
        ...p,
        id: `post-${i}`,
        queue_id: "queue-id",
      }));
      media = values.assets.map((m, i) => ({
        ...m,
        id: `media-${i}`,
        queue_id: "queue-id",
        status: "Draft",
      }));
      body = "queue-id";
    } else if (
      url.pathname.includes("/content_queue") ||
      url.pathname.includes("/social_posts") ||
      url.pathname.includes("/media_assets")
    ) {
      const collection = url.pathname.includes("/content_queue")
        ? queue
        : url.pathname.includes("/social_posts")
          ? posts
          : media;
      if (method === "POST") {
        const value = req.postDataJSON();
        const index = collection.findIndex((x) => x.id === value.id);
        collection[index] = value;
        body = value;
      } else body = collection;
    } else if (url.pathname.includes("/products")) {
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
  await page.goto("http://127.0.0.1:5274/modern-finds-guide/admin");
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
  // Supabase emits SIGNED_IN again when the browser tab regains focus.
  await page.evaluate(async () => {
    const { backend } = await import("/modern-finds-guide/src/backend.js");
    let subscription;
    await new Promise((resolve) => {
      const { data } = backend.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") resolve();
      });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      window.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      window.dispatchEvent(new Event("visibilitychange"));
      subscription = data.subscription;
    });
    subscription.unsubscribe();
    delete document.visibilityState;
  });
  await expect(page.getByLabel("Product title")).toHaveValue(
    "Useful test find",
  );
  await expect(page.getByLabel("Amazon affiliate URL")).toHaveValue(
    "https://amzn.to/test",
  );

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
  await page
    .getByRole("button", { name: "Generate Content Pack", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Generate Content Pack", exact: true })
    .click();
  await expect(
    page.getByText("1 content packs created.", { exact: false }),
  ).toBeVisible();
  expect(queue).toHaveLength(1);
  expect(posts).toHaveLength(2);
  expect(media).toHaveLength(3);
  await page.getByRole("button", { name: "Review pack" }).click();
  await expect(
    page.getByRole("heading", { name: "Website copy · Draft" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve website copy" }).click();
  await expect(
    page.getByRole("button", { name: "Publish approved product to site" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Media Library", exact: true })
    .click();
  await expect(page.locator(".media-grid img")).toHaveCount(3);
  await page.getByRole("button", { name: "Approve asset" }).first().click();
  expect(media[0].status).toBe("Approved");
  await page.screenshot({
    path: "test-results/automation-media.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Products", exact: true }).click();
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
