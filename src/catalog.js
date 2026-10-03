import original from "./products.json";
export const categories = [
  "Car Finds",
  "Home",
  "Pets",
  "Tech",
  "Maker/3D Printing",
];
export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const seedProducts = original.map((p, i) => ({
  id: String(p.id),
  slug: slugify(p.title),
  title: p.title,
  description: p.description,
  notes: "",
  image_url: p.image,
  affiliate_url: p.affiliateLink,
  category: "Home",
  tags: i === 3 ? ["Everyday carry"] : ["Organization"],
  featured: [0, 2, 3].includes(i),
  published: true,
  sort_order: i,
  display_text: "Check price on Amazon",
}));
export function safeUrl(value, amazon = false) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      (!amazon ||
        /^(amzn\.to|link\.amazon|([a-z0-9-]+\.)?amazon\.(com|ca|co\.uk|de|fr|it|es|co\.jp|com\.au|in))$/i.test(
          u.hostname,
        ))
    );
  } catch {
    return false;
  }
}
export function filterProducts(products, category, query, sort = "curated") {
  const q = query.trim().toLowerCase();
  return products
    .filter(
      (p) =>
        p.published &&
        (category === "all" || p.category === category) &&
        [p.title, p.description, ...(p.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) =>
      sort === "az"
        ? a.title.localeCompare(b.title)
        : sort === "newest"
          ? (b.created_at || "").localeCompare(a.created_at || "")
          : a.sort_order - b.sort_order || a.title.localeCompare(b.title),
    );
}
export function validateProduct(p) {
  if (!p.title.trim() || !p.description.trim())
    return "Add a title and short description.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
    return "Use lowercase letters, numbers, and hyphens for the slug.";
  if (!categories.includes(p.category)) return "Choose a category.";
  if (!safeUrl(p.affiliate_url, true))
    return "Use an HTTPS Amazon, amzn.to, or link.amazon URL.";
  if (p.image_url && !safeUrl(p.image_url)) return "Use an HTTPS image URL.";
  if (!Number.isInteger(Number(p.sort_order)))
    return "Sort order must be a whole number.";
  return "";
}
