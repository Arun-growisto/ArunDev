import { clean } from "../../../lib/shopify";
import { list } from "../../../lib/db";
export default function handler(req, res) {
  const { store } = req.query;
  if (!store) return res.status(400).json({ error: "store param required" });
  return res.json({ projects: list(clean(store)) });
}
