import apiDocs from "../apiDocs";

export const resolveMediaUrl = (src: string): string => {
  const source = src.trim();
  if (!source || source.startsWith("#") || /^(?:data|blob):/i.test(source)) {
    return src;
  }

  // Media files live at the API host's root, outside its /v1 routes.
  const origin = new URL(apiDocs.baseURL).origin;
  const url = new URL(source, `${origin}/`);
  if (url.protocol !== "http:" && url.protocol !== "https:") return src;

  return `${origin}${url.pathname}${url.search}${url.hash}`;
};
