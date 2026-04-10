import { TOOLS, callTool } from "../../lib/tools";

export const config = { api: { bodyParser: true } };
const SRV = { name: "shopify-auditor", version: "1.0.0" };
const PROTO = "2024-11-05";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Mcp-Session-Id");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.json({ name: SRV.name, version: SRV.version, tools: TOOLS.length, status: "ok" });
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body;
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map(dispatch));
    return res.json(results.filter(Boolean));
  }
  const result = await dispatch(body);
  if (result === null) return res.status(202).end();
  return res.json(result);
}

async function dispatch(msg) {
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) return null;
  const ok  = (r) => ({ jsonrpc:"2.0", id, result: r });
  const err = (c, m) => ({ jsonrpc:"2.0", id, error:{ code:c, message:m } });
  try {
    switch (method) {
      case "initialize":
        return ok({
          protocolVersion: PROTO, serverInfo: SRV, capabilities: { tools:{} },
          instructions:
            "Shopify theme code auditor. Workflow: " +
            "1. shopify_connect — verify credentials. " +
            "2. shopify_list_themes — find theme with role=main (or use the theme_id provided by the user). " +
            "3. shopify_get_audit_bundle — fetch top files. " +
            "4. Analyse across 8 categories: CSS Architecture, SEO, Performance, Accessibility, Code Quality, Internationalization, Liquid Best Practices, JS/Security. " +
            "5. save_audit_report — save the structured report to the dashboard. This is mandatory as the final step.",
        });
      case "initialized": return null;
      case "ping":        return ok({});
      case "tools/list":  return ok({ tools: TOOLS });
      case "tools/call": {
        const name = params?.name;
        const args = params?.arguments || {};
        if (!name) return err(-32602, "Missing tool name");
        if (!TOOLS.find((t) => t.name === name)) return err(-32601, `Unknown tool: ${name}`);
        const result = await callTool(name, args);
        return ok({ content:[{ type:"text", text: JSON.stringify(result, null, 2) }], isError:!!result?.error });
      }
      case "logging/setLevel": return ok({});
      default: return err(-32601, `Method not found: ${method}`);
    }
  } catch (e) { return err(-32603, `Internal error: ${e.message}`); }
}
