import { clean, sfetch, fetchBundle, auditable, score, truncate } from "./shopify";
import { save } from "./db";

export const TOOLS = [
  {
    name: "shopify_connect",
    description: "Verify store credentials. Call this first.",
    inputSchema: { type:"object", properties: { store_url:{type:"string"}, access_token:{type:"string"} }, required:["store_url","access_token"] },
  },
  {
    name: "shopify_list_themes",
    description: "List all themes. The live theme has role=main.",
    inputSchema: { type:"object", properties: { store_url:{type:"string"}, access_token:{type:"string"} }, required:["store_url","access_token"] },
  },
  {
    name: "shopify_get_audit_bundle",
    description: "Fetch top priority theme files for a full audit. Returns file contents. Use this as the main data source, then analyse and call save_audit_report.",
    inputSchema: { type:"object", properties: { store_url:{type:"string"}, access_token:{type:"string"}, theme_id:{type:"number"}, max_files:{type:"number"} }, required:["store_url","access_token","theme_id"] },
  },
  {
    name: "shopify_read_file",
    description: "Read a specific theme file e.g. assets/custom.css",
    inputSchema: { type:"object", properties: { store_url:{type:"string"}, access_token:{type:"string"}, theme_id:{type:"number"}, file_key:{type:"string"} }, required:["store_url","access_token","theme_id","file_key"] },
  },
  {
    name: "shopify_list_files",
    description: "List all auditable theme files ranked by audit priority.",
    inputSchema: { type:"object", properties: { store_url:{type:"string"}, access_token:{type:"string"}, theme_id:{type:"number"} }, required:["store_url","access_token","theme_id"] },
  },
  {
    name: "save_audit_report",
    description: "Save the completed audit report to the dashboard. Call this as the FINAL step after analysing all files. The report will appear instantly in the dashboard.",
    inputSchema: {
      type: "object",
      properties: {
        store_url:    { type:"string" },
        store_name:   { type:"string" },
        theme_id:     { type:"number" },
        theme_name:   { type:"string" },
        overall_score:{ type:"number", description:"0-100" },
        summary:      { type:"string" },
        files_analysed:     { type:"array", items:{type:"string"} },
        total_files_in_theme:{ type:"number" },
        issues: {
          type:"array",
          items: {
            type:"object",
            properties:{
              id:{type:"number"}, severity:{type:"string"}, category:{type:"string"},
              title:{type:"string"}, file:{type:"string"}, line:{type:"string"},
              found:{type:"string"}, fix:{type:"string"}, effort:{type:"string"},
            },
          },
        },
        grades: {
          type:"array",
          items:{ type:"object", properties:{ category:{type:"string"}, grade:{type:"string"}, score:{type:"number"}, issues:{type:"number"} } },
        },
        action_plan: {
          type:"array",
          items:{ type:"object", properties:{ phase:{type:"string"}, items:{ type:"array", items:{ type:"object", properties:{ action:{type:"string"}, effort:{type:"string"}, file:{type:"string"} } } } } },
        },
        positives: { type:"array", items:{type:"string"} },
      },
      required:["store_url","theme_id","theme_name","overall_score","summary","issues","grades","action_plan"],
    },
  },
];

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function callTool(name, args) {
  const domain = args.store_url ? clean(args.store_url) : null;
  const token  = args.access_token || null;

  try {
    switch (name) {
      case "shopify_connect": {
        const r = await sfetch(domain, token, "/shop.json");
        if (!r.ok) return { error: `Auth failed (${r.status}). Check store URL and token.` };
        const { shop } = await r.json();
        return { connected:true, shop:{ name:shop.name, domain:shop.domain, plan:shop.plan_display_name } };
      }
      case "shopify_list_themes": {
        const r = await sfetch(domain, token, "/themes.json");
        if (!r.ok) return { error: `Shopify ${r.status}` };
        const { themes } = await r.json();
        return { themes: themes.map((t)=>({ id:t.id, name:t.name, role:t.role, updated_at:t.updated_at })).sort((a,b)=>a.role==="main"?-1:1) };
      }
      case "shopify_get_audit_bundle": {
        const { files, total } = await fetchBundle(domain, token, args.theme_id, Math.min(args.max_files||14,20));
        return {
          files_fetched: files.length, total_assets_in_theme: total,
          audit_instruction: "Analyse ALL files below across 8 categories: (1) CSS Architecture — global selector overrides, !important overuse, hardcoded hex colors, duplicate classes, inline <style> blocks. (2) SEO — multiple H1s, hardcoded meta descriptions, robots meta, alt attributes. (3) Performance — JS font loading, assigns in Liquid loops, hardcoded paginate limits. (4) Accessibility — missing alt, ARIA labels, keyboard focus, form labels. (5) Code Quality — console.log in JS, dead code, class name typos. (6) Internationalization — hardcoded English strings not using t filter. (7) Liquid Best Practices — deprecated filters (img_url), all_products, assigns in loops. (8) JS/Security — eval(), inline handlers, hardcoded tokens. When done call save_audit_report.",
          files,
        };
      }
      case "shopify_read_file": {
        const r = await sfetch(domain, token, `/themes/${args.theme_id}/assets.json?asset[key]=${encodeURIComponent(args.file_key)}`);
        if (!r.ok) return { error: `File not found (${r.status})` };
        const { asset } = await r.json();
        const raw = asset?.value || "";
        return { key:asset.key, lines:raw.split("\n").length, content:truncate(raw,800) };
      }
      case "shopify_list_files": {
        const r = await sfetch(domain, token, `/themes/${args.theme_id}/assets.json`);
        if (!r.ok) return { error: `Shopify ${r.status}` };
        const { assets } = await r.json();
        return { total:assets.length, files: assets.filter((a)=>auditable(a.key)).map((a)=>({ key:a.key, priority:score(a.key) })).sort((a,b)=>b.priority-a.priority) };
      }
      case "save_audit_report": {
        const id = `audit_${args.theme_id}_${Date.now()}`;
        const project = {
          id, storeUrl: clean(args.store_url), storeName: args.store_name || clean(args.store_url),
          themeName: args.theme_name, themeId: args.theme_id,
          auditDate: new Date().toISOString(), overallScore: args.overall_score,
          summary: args.summary, filesAnalysed: args.files_analysed || [],
          totalFilesInTheme: args.total_files_in_theme || 0,
          issues: args.issues || [], grades: args.grades || [],
          actionPlan: args.action_plan || [], positives: args.positives || [],
        };
        save(project);
        return {
          saved: true, project_id: id,
          message: `Report saved. ${project.issues.length} issues found. Score: ${project.overallScore}/100. Now visible in the dashboard.`,
        };
      }
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (e) { return { error: e.message }; }
}
