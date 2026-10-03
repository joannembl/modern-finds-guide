import { slugify, safeUrl } from "./catalog";
export const templates = [
  "Single-product hero",
  "List pin",
  "Problem / solution",
  "Editorial collage",
];
export const formats = {
  Pinterest: [1000, 1500],
  Instagram: [1080, 1350],
  Cover: [1080, 1920],
};
export function identity(url) {
  if (!safeUrl(url, true))
    throw new Error("Use an HTTPS Amazon affiliate URL.");
  const u = new URL(url);
  const asin = u.pathname.match(
    /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i,
  );
  return asin
    ? `asin:${asin[1].toUpperCase()}`
    : `${u.hostname.toLowerCase()}${u.pathname.replace(/\/$/, "")}`;
}
export function contentPack(products, origin) {
  if (!products.length) throw new Error("Select at least one product.");
  const p = products[0],
    multi = products.length > 1;
  const title = multi
    ? `${products.length} Amazon Must-Haves · ${p.category}`
    : p.title;
  const destination = multi
    ? `${origin}/?category=${encodeURIComponent(p.category)}`
    : `${origin}/find/${p.slug}`;
  const disclosure =
    "Affiliate links. As an Amazon Associate I earn from qualifying purchases.";
  return {
    website: {
      title: p.title,
      description: p.description,
      notes:
        p.notes ||
        `${p.description} Check the listing for dimensions, compatibility and seller details before deciding whether it fits your needs.`,
      category: p.category,
      tags: p.tags || [],
      key_features: [],
      seo_title: `${p.title} | Modern Finds Guide`.slice(0, 60),
      seo_description: p.description.slice(0, 160),
      display_text: "Check price on Amazon",
      placements: [`${p.category} everyday essentials`],
    },
    posts: ["Pinterest", "Instagram"].map((platform) => ({
      platform,
      status: "Draft",
      title,
      description: `${products.map((x) => x.description).join("\n\n")}\n\nExplore the guide for details. ${disclosure}`,
      destination_url: destination,
      board: p.category,
      alt_text: `Modern Finds Guide editorial featuring ${products.map((x) => x.title).join(", ")}. Typography-only creative.`,
      hashtags: "#ModernFindsGuide #AmazonFinds #EverydayEssentials",
      cta: "Explore the guide — link in bio.",
      product_ids: products.map((x) => x.id),
    })),
  };
}
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export function creativeSVG(post, products, template, format = post.platform) {
  const [w, h] = formats[format];
  const colors = {
    Home: "#e8ebdf",
    "Car Finds": "#e3e7e6",
    Pets: "#efe5da",
    Tech: "#dfe8ed",
    "Maker/3D Printing": "#e9e0ef",
  };
  const lines = [];
  let line = "";
  for (const word of post.title.split(/\s+/)) {
    if ((line + " " + word).length > 25) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  lines.push(line);
  const heading =
    template === "Problem / solution"
      ? "A more thoughtful everyday"
      : template === "List pin"
        ? "Your next useful finds"
        : template === "Editorial collage"
          ? "The considered edit"
          : "Good finds. Thoughtful living.";
  const cy = Math.round(h * 0.55);
  const motif =
    template === "Editorial collage"
      ? `<rect x="${w / 2 - 240}" y="${cy - 100}" width="200" height="180" rx="20" fill="#faf8f2" transform="rotate(-9 ${w / 2 - 140} ${cy})"/><rect x="${w / 2 + 10}" y="${cy - 80}" width="210" height="180" rx="20" fill="#213c32" transform="rotate(8 ${w / 2 + 110} ${cy})"/><circle cx="${w / 2}" cy="${cy}" r="66" fill="#bd663f"/>`
      : template === "Problem / solution"
        ? `<rect x="90" y="${cy - 90}" width="${w - 180}" height="170" rx="18" fill="#faf8f2"/><text x="130" y="${cy - 28}" font-family="Georgia" font-size="36" fill="#213c32">Make room for useful.</text><text x="130" y="${cy + 30}" font-family="Arial" font-size="26" fill="#606a63">Consider the fit. Check the details.</text>`
        : template === "List pin"
          ? `<path d="M100 ${cy - 65}H${w - 100}M100 ${cy}H${w - 180}M100 ${cy + 65}H${w - 260}" stroke="#213c32" stroke-width="12" opacity=".2"/><circle cx="110" cy="${cy - 65}" r="22" fill="#bd663f"/><circle cx="110" cy="${cy}" r="22" fill="#bd663f"/><circle cx="110" cy="${cy + 65}" r="22" fill="#bd663f"/>`
          : `<circle cx="${w / 2}" cy="${cy}" r="105" fill="#faf8f2"/><circle cx="${w / 2}" cy="${cy}" r="125" fill="none" stroke="#213c32" opacity=".25"/><text x="${w / 2}" y="${cy + 28}" text-anchor="middle" font-family="Georgia" font-style="italic" font-size="100" fill="#213c32">mf</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#faf8f2"/><rect x="40" y="40" width="${w - 80}" height="${h - 80}" rx="20" fill="${colors[products[0]?.category] || "#e8ebdf"}"/><text x="90" y="135" font-family="Arial" font-size="28" letter-spacing="4" fill="#213c32">MODERN FINDS GUIDE</text><path d="M90 185H${w - 90}" stroke="#213c32"/><text x="90" y="265" font-family="Arial" font-size="26" fill="#bd663f">${esc(heading)}</text>${lines
    .slice(0, 6)
    .map(
      (l, i) =>
        `<text x="90" y="${340 + i * 58}" font-family="Georgia" font-size="48" fill="#213c32">${esc(l)}</text>`,
    )
    .join("")}${motif}${products
    .slice(0, 5)
    .map(
      (p, i) =>
        `<text x="90" y="${h - 440 + i * 55}" font-family="Arial" font-size="26" fill="#213c32">${esc(`${i + 1}. ${p.title}`.slice(0, 53))}</text>`,
    )
    .join(
      "",
    )}<text x="90" y="${h - 130}" font-family="Arial" font-size="26" fill="#213c32">Explore Modern Finds Guide</text><text x="90" y="${h - 85}" font-family="Arial" font-size="19" fill="#606a63">Affiliate links · Details in the guide</text></svg>`;
}
export function download(data, name, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadPNG(svg, name) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Could not export image.");
    download(blob, name, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function manualCandidate(values) {
  const title = values.title.trim();
  if (!title || !values.description.trim())
    throw new Error("Add a product title and verified description.");
  return {
    ...values,
    slug: slugify(title),
    source_key: identity(values.affiliate_url),
    published: false,
    sort_order: 0,
    tags: [],
    notes: "",
    image_url: "",
    display_text: "Check price on Amazon",
  };
}
