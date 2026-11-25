/**
 * Resolves a possibly-relative upload path (e.g. "uploads/models/x.glb")
 * against the current environment's uploads base URL, so content authored
 * on one environment (or copied from a DB seed) still loads wherever it's
 * rendered. Known backend upload URLs are rebased; external URLs stay intact.
 */
export function resolveUploadUrl(src: string, baseUrl: string): string {
  const trimmed = (src || "").trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('#') || /^(?:data|blob):/i.test(trimmed)) return trimmed;
  const cleanBase = (baseUrl || "").replace(/\/+$/, "").replace(/\/v\d+$/i, "");
  if (!cleanBase) return trimmed;
  let path = trimmed;
  if (/^(https?:)?\/\//i.test(trimmed)) {
    try {
      const source = new URL(trimmed, 'https://relative.invalid');
      const configuredHost = /^https?:\/\//i.test(cleanBase) ? new URL(cleanBase).hostname : '';
      const backendHosts = ['opschool.tie.go.tz', 'apitie.ekima.africa', '41.59.251.166', 'localhost', '127.0.0.1', '[::1]', 'gateway'];
      if (source.hostname !== configuredHost && !backendHosts.includes(source.hostname)) return trimmed;
      const uploads = source.pathname.match(/(?:^|\/)uploads(?:\/.*)?$/);
      if (!uploads) return trimmed;
      path = uploads[0].replace(/^\//, '') + source.search + source.hash;
    } catch {
      return trimmed;
    }
  }
  // Strip an existing gateway/API prefix instead of producing /api/api/uploads.
  path = path.replace(/^\/?(?:api\/(?:v\d+\/)?)?(uploads(?:\/|$))/i, '$1');
  if (path.startsWith(`${cleanBase}/`)) return path;
  return `${cleanBase}/${path.replace(/^\/+/, "")}`;
}

/**
 * Entry-page filenames seen across uploaded experiment/activity packages. Different
 * authoring tools used to build these name their own entry page differently -- most are
 * "index.html", but some packages were built with "find.html" instead. Tried in this order.
 */
const EXPERIMENT_ENTRY_CANDIDATES = ["index.html", "find.html"];

/**
 * The page to open for an experiment/activity package. The API only gives the package's
 * folder (".../steps/<id>/Activity2.1/"), and the uploads server doesn't serve a folder's
 * entry page by itself (it 404s on the bare folder path) -- the mobile app hit this same
 * 404 and fixed it by naming the entry page explicitly. Since the entry page's name varies
 * by package (see [EXPERIMENT_ENTRY_CANDIDATES]), this probes each candidate and uses
 * whichever one actually exists. Links to an actual page or file (no trailing slash) are
 * left as they are, with no probing needed.
 */
export async function resolveExperimentEntryUrl(
  src: string,
  baseUrl: string = "",
  candidates: string[] = EXPERIMENT_ENTRY_CANDIDATES,
): Promise<string> {
  const url = resolveUploadUrl(src, baseUrl);
  const path = (url.split("?")[0] ?? "").split("#")[0] ?? "";
  if (!path.endsWith("/") || !/^https?:/i.test(url)) return url;
  const rest = url.slice(path.length);

  if (typeof fetch === "function") {
    for (const name of candidates) {
      const candidateUrl = `${path}${name}${rest}`;
      try {
        const response = await fetch(candidateUrl, { method: "HEAD" });
        if (response.ok) return candidateUrl;
      } catch {
        // Network/CORS error probing this candidate -- try the next one.
      }
    }
  }
  // Nothing probed successfully (SSR, offline, or every candidate is missing): fall back to
  // the most common entry name rather than the bare folder, which is already known to 404.
  return `${path}${candidates[0]}${rest}`;
}
