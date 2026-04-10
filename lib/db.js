// Global in-memory store — survives across requests in the same warm Lambda instance.
// Reports are stored by store domain so multiple stores are independent.
// On Vercel Hobby: instances stay warm for ~10 minutes. For production persistence use Vercel KV.

if (!global.__reports) global.__reports = {};

export function save(report) {
  const key = report.storeUrl;
  if (!global.__reports[key]) global.__reports[key] = [];
  const idx = global.__reports[key].findIndex((r) => r.id === report.id);
  if (idx >= 0) global.__reports[key][idx] = report;
  else global.__reports[key].unshift(report);
  if (global.__reports[key].length > 50) global.__reports[key] = global.__reports[key].slice(0, 50);
  return report;
}

export function list(storeUrl) {
  return (global.__reports[storeUrl] || []).map((r) => ({
    id: r.id, storeUrl: r.storeUrl, storeName: r.storeName,
    themeName: r.themeName, themeId: r.themeId,
    auditDate: r.auditDate, overallScore: r.overallScore,
    issueCount: r.issues?.length || 0,
    critical: r.issues?.filter((i) => i.severity === "Critical").length || 0,
    high:     r.issues?.filter((i) => i.severity === "High").length || 0,
    medium:   r.issues?.filter((i) => i.severity === "Medium").length || 0,
    low:      r.issues?.filter((i) => i.severity === "Low").length || 0,
  }));
}

export function get(storeUrl, id) {
  return (global.__reports[storeUrl] || []).find((r) => r.id === id) || null;
}

export function remove(storeUrl, id) {
  if (!global.__reports[storeUrl]) return false;
  const before = global.__reports[storeUrl].length;
  global.__reports[storeUrl] = global.__reports[storeUrl].filter((r) => r.id !== id);
  return global.__reports[storeUrl].length < before;
}

export function allStores() {
  return Object.keys(global.__reports);
}
