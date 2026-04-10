import { clean } from "../../../lib/shopify";
import { get, remove } from "../../../lib/db";
export default function handler(req, res) {
  const { id, store } = req.query;
  if (!store) return res.status(400).json({ error: "store param required" });
  const domain = clean(store);
  if (req.method === "GET") {
    const p = get(domain, id);
    return p ? res.json({ project: p }) : res.status(404).json({ error: "Not found" });
  }
  if (req.method === "DELETE") return res.json({ deleted: remove(domain, id) });
  return res.status(405).end();
}
