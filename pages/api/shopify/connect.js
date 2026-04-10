import { clean, sfetch } from "../../../lib/shopify";
export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
  const { storeUrl, accessToken } = req.body || {};
  if (!storeUrl || !accessToken) return res.status(400).json({ error: "storeUrl and accessToken required" });
  const domain = clean(storeUrl);
  try {
    const r = await sfetch(domain, accessToken, "/shop.json");
    if (!r.ok) return res.status(r.status).json({ error: r.status === 401 ? "Invalid access token." : r.status === 404 ? "Store not found." : `Shopify error ${r.status}` });
    const { shop } = await r.json();
    return res.json({ ok: true, shop: { name: shop.name, domain: shop.domain, plan: shop.plan_display_name, country: shop.country_name } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
