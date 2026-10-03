import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111";
const visitor = "22222222-2222-4222-8222-222222222222";
const product = (slug, published) =>
  `insert into public.products(slug,title,category,description,affiliate_url,published) values ('${slug}','Test','Home','Description','https://amzn.to/test',${published})`;
async function as(role, uid, sql) {
  await db.exec(
    `set role ${role};select set_config('request.jwt.claim.sub','${uid || ""}',false);`,
  );
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values ('${owner}'),('${visitor}');`,
  );
  await db.exec(
    readFileSync(
      new URL(
        "../supabase/migrations/20261003030814_product_catalog.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    `insert into public.admin_users values ('${owner}');${product("published", true)};${product("draft", false)};`,
  );
}, 30000);
afterAll(() => db.close());
describe("PostgreSQL access policies", () => {
  it("anonymous visitors read published products only and cannot write", async () => {
    expect(
      (await as("anon", null, "select slug from public.products")).rows,
    ).toEqual([{ slug: "published" }]);
    await expect(
      as("anon", null, product("forbidden", true)),
    ).rejects.toThrow();
    await expect(
      as(
        "anon",
        null,
        "update public.products set title='bad' where slug='published'",
      ),
    ).rejects.toThrow();
    await expect(
      as("anon", null, "delete from public.products where slug='published'"),
    ).rejects.toThrow();
  });
  it("signed-in nonowners cannot see drafts or promote themselves", async () => {
    expect(
      (await as("authenticated", visitor, "select slug from public.products"))
        .rows,
    ).toEqual([{ slug: "published" }]);
    expect(
      (await as("authenticated", visitor, "select * from public.admin_users"))
        .rows,
    ).toEqual([]);
    await expect(
      as(
        "authenticated",
        visitor,
        `insert into public.admin_users values ('${visitor}')`,
      ),
    ).rejects.toThrow();
    await expect(
      as("authenticated", visitor, product("forbidden", false)),
    ).rejects.toThrow();
    expect(
      (
        await as(
          "authenticated",
          visitor,
          "update public.products set title='bad' returning id",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await as(
          "authenticated",
          visitor,
          "delete from public.products returning id",
        )
      ).rows,
    ).toEqual([]);
  });
  it("owner can read drafts and manage the complete lifecycle", async () => {
    expect(
      (await as("authenticated", owner, "select * from public.products")).rows,
    ).toHaveLength(2);
    await as("authenticated", owner, product("owner-new", false));
    await as(
      "authenticated",
      owner,
      "update public.products set published=true,featured=true,sort_order=-10 where slug='owner-new'",
    );
    expect(
      (
        await as(
          "anon",
          null,
          "select slug from public.products order by sort_order",
        )
      ).rows[0].slug,
    ).toBe("owner-new");
    await as(
      "authenticated",
      owner,
      "update public.products set published=false where slug='owner-new'",
    );
    expect(
      (
        await as(
          "anon",
          null,
          "select * from public.products where slug='owner-new'",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await as(
          "authenticated",
          owner,
          "delete from public.products where slug='owner-new' returning slug",
        )
      ).rows,
    ).toEqual([{ slug: "owner-new" }]);
  });
  it("revoking owner membership immediately prevents mutation", async () => {
    await db.exec(`delete from public.admin_users where user_id='${owner}'`);
    expect(
      (
        await as(
          "authenticated",
          owner,
          "update public.products set title='bad' returning id",
        )
      ).rows,
    ).toEqual([]);
    await expect(
      as("authenticated", owner, product("revoked", false)),
    ).rejects.toThrow();
  });
});
