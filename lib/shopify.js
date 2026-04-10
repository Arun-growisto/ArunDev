export const API_VER = "2024-10";
export const clean = (raw = "") => raw.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase().trim();
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const sfetch = (domain, token, path) =>
  fetch(`https://${domain}/admin/api/${API_VER}${path}`, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
  });

export const PRIORITY = [
  "layout/theme.liquid","layout/password.liquid",
  "assets/base.css","assets/application.css","assets/custom.css",
  "assets/theme.js","assets/application.js","assets/custom.js",
  "sections/header.liquid","sections/footer.liquid",
  "sections/main-product.liquid","sections/featured-collection.liquid",
  "snippets/product-card.liquid","snippets/media.liquid",
  "config/settings_schema.json",
];

export const EXTS = [".liquid",".css",".js",".json"];
export const auditable = (key) => EXTS.some((e) => key.endsWith(e));

export function score(key) {
  if (PRIORITY.includes(key))           return 100;
  if (key.startsWith("layout/"))        return 90;
  if (key.startsWith("sections/main-")) return 80;
  if (key.startsWith("sections/"))      return 60;
  if (key.startsWith("snippets/"))      return 55;
  if (key.endsWith(".css"))             return 50;
  if (key.endsWith(".js"))              return 45;
  if (key.startsWith("config/"))        return 40;
  return 10;
}

export function truncate(src, max = 500) {
  const lines = src.split("\n");
  if (lines.length <= max) return src;
  const h = Math.floor(max / 2);
  return [...lines.slice(0, h), `\n... [${lines.length - max} lines omitted] ...\n`, ...lines.slice(-h)].join("\n");
}

export async function fetchBundle(domain, token, themeId, max = 14) {
  const r = await sfetch(domain, token, `/themes/${themeId}/assets.json`);
  if (!r.ok) throw new Error(`Shopify ${r.status}`);
  const { assets } = await r.json();
  const ranked = assets.filter((a) => auditable(a.key))
    .map((a) => ({ key: a.key, s: score(a.key) }))
    .sort((a, b) => b.s - a.s).slice(0, max);
  const files = [];
  for (let i = 0; i < ranked.length; i++) {
    try {
      const fr = await sfetch(domain, token, `/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(ranked[i].key)}`);
      if (fr.ok) { const fd = await fr.json(); const raw = fd.asset?.value || ""; files.push({ key: ranked[i].key, lines: raw.split("\n").length, content: truncate(raw) }); }
    } catch (_) {}
    if (i < ranked.length - 1) await sleep(520);
  }
  return { files, total: assets.length };
}
