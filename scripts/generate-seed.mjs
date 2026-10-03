import fs from "node:fs";
const original = JSON.parse(
  fs.readFileSync(new URL("../src/products.json", import.meta.url)),
);
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
const slug = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const sql =
  "-- Existing recommendations. Review duplicate short links and image permissions before publishing.\n" +
  original
    .map(
      (p, i) =>
        `insert into public.products (slug,title,category,description,image_url,affiliate_url,tags,featured,published,sort_order) values (${[slug(p.title), p.title, "Home", p.description, p.image, p.affiliateLink].map(quote).join(",")}, ARRAY[${quote(i === 3 ? "Everyday carry" : "Organization")}], ${[0, 2, 3].includes(i)}, true, ${i}) on conflict (slug) do nothing;`,
    )
    .join("\n") +
  "\n";
fs.writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
