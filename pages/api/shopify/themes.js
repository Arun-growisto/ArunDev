import { clean, sfetch } from "../../../lib/shopify";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { storeUrl, accessToken } = req.body || {};
  const domain = clean(storeUrl);
  try {
    const r = await sfetch(domain, accessToken, "/themes.json");
    if (!r.ok) return res.status(r.status).json({ error: `Shopify ${r.status}` });
    const { themes } = await r.json();
    return res.json({ themes: themes.map((t) => ({ id: t.id, name: t.name, role: t.role, updated_at: t.updated_at })).sort((a,b)=>a.role==="main"?-1:1) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
