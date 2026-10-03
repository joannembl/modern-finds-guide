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
    readFileSync(
      new URL(
        "../supabase/migrations/20261003042236_content_automation.sql",
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
  it("automation stays owner-only, packs are atomic, and approval is required", async () => {
    await expect(
      as("anon", null, "select * from public.content_queue"),
    ).rejects.toThrow();
    expect(
      (await as("authenticated", visitor, "select * from public.content_queue"))
        .rows,
    ).toEqual([]);
    const id = (
      await db.query("select id from public.products where slug='draft'")
    ).rows[0].id;
    const pack = JSON.stringify({
      website: {
        title: "Test",
        description: "Verified",
        notes: "Notes",
        category: "Home",
        tags: [],
        key_features: [],
        placements: [],
        seo_title: "Test",
        seo_description: "Verified",
        display_text: "Check price on Amazon",
      },
      posts: [
        {
          platform: "Pinterest",
          title: "Test",
          description: "Verified",
          destination_url: "https://example.com/find/draft",
          board: "Home",
          alt_text: "Typography",
          hashtags: "",
          cta: "",
        },
      ],
    }).replaceAll("'", "''");
    const call = `select public.create_content_pack(array['${id}'::uuid],'${pack}'::jsonb,'[]'::jsonb) as id`;
    const q = (await as("authenticated", owner, call)).rows[0].id;
    await expect(as("authenticated", owner, call)).rejects.toThrow();
    await expect(
      as("authenticated", owner, `select public.approve_site_content('${q}')`),
    ).rejects.toThrow();
    await expect(
      as(
        "authenticated",
        owner,
        `update public.social_posts set status='Scheduled',scheduled_at=now() where queue_id='${q}'`,
      ),
    ).rejects.toThrow();
    await as(
      "authenticated",
      owner,
      `update public.content_queue set status='Approved' where id='${q}';`,
    );
    await as(
      "authenticated",
      owner,
      `select public.approve_site_content('${q}')`,
    );
    await as(
      "authenticated",
      owner,
      `insert into public.media_assets(queue_id,platform,format,template,svg,status) values('${q}','Pinterest','Pinterest','hero','<svg/>','Approved')`,
    );
    await as(
      "authenticated",
      owner,
      `update public.social_posts set status='Approved' where queue_id='${q}'`,
    );
    await as(
      "authenticated",
      owner,
      `update public.social_posts set status='Scheduled',scheduled_at=now() where queue_id='${q}'`,
    );
    await as(
      "authenticated",
      owner,
      `update public.social_posts set description='Edited' where queue_id='${q}'`,
    );
    expect(
      (
        await as(
          "authenticated",
          owner,
          `select status,scheduled_at from public.social_posts where queue_id='${q}'`,
        )
      ).rows[0],
    ).toEqual({ status: "Draft", scheduled_at: null });
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
