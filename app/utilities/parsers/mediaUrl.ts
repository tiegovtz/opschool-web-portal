import apiDocs from "../apiDocs";
import { resolveUploadUrl } from "../resolveUploadUrl";

export const resolveMediaUrl = (src: string): string => {
  const source = src.trim();
  if (!source || source.startsWith("#") || /^(?:data|blob):/i.test(source)) {
    return src;
  }

  // Media files live at the API host's root, outside its /v1 routes. apiDocs.baseURL
  // is a gateway-relative path (e.g. "/api/v1"), not an absolute host, so new
  // URL(apiDocs.baseURL).origin throws unconditionally here — strip the trailing
  // /v1 with plain string ops instead, the same way resolveUploadUrl does.
  const root = (apiDocs.baseURL || "").replace(/\/+$/, "").replace(/\/v1$/, "");
  return resolveUploadUrl(source, root) || src;
};
