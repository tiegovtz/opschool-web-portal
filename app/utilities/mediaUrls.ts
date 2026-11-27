import { resolveUploadUrl } from './resolveUploadUrl';

export interface MediaUrlOptions {
  appBaseURL?: string;
  uploadsBaseURL?: string;
}

export function portalPath(path: string, baseURL = '/') {
  const base = `/${baseURL.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
  const source = `/${path.replace(/^\/+/, '')}`;
  return base && (source === base || source.startsWith(`${base}/`)) ? source : `${base}${source}`;
}

export function resolveContentAssetUrl(src: string, options: MediaUrlOptions = {}) {
  const source = String(src || '').trim();
  if (!source || source.startsWith('#') || /^(?:data|blob):/i.test(source)) return source;
  if (/^[a-z][a-z\d+.-]*:/i.test(source) && !/^https?:/i.test(source)) return '';
  if (/^\/(?:public\/)?(?:images|logo|font|videos|temp-audio)\//i.test(source)) {
    return portalPath(source.replace(/^\/public\//, '/'), options.appBaseURL);
  }
  const base = options.appBaseURL?.replace(/\/+$/, '');
  if (base && source.startsWith(`${base}/`)) return source;
  return resolveUploadUrl(source, options.uploadsBaseURL || '/api');
}

export function streamMediaId(src: string, kind: 'video' | 'audio') {
  const source = String(src || '').trim();
  const path = source.split(/[?#]/, 1)[0] || '';
  if (/^[a-z\d_-]+$/i.test(path)) return path;
  const match = path.match(new RegExp(`/(?:api/${kind}|${kind}-stream)/([^/]+)/*$`, 'i'));
  if (!match) return null;
  try {
    const id = decodeURIComponent(match[1]!);
    return /^[a-z\d_-]+$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function resolveStreamUrl(src: string, kind: 'video' | 'audio', options: MediaUrlOptions = {}) {
  const id = streamMediaId(src, kind);
  return id ? portalPath(`api/${kind}/${encodeURIComponent(id)}`, options.appBaseURL)
    : resolveContentAssetUrl(src, options);
}

export function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function readMediaAttribute(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').replace(/&amp;/g, '&');
}

export function mediaSourceFromHtml(html: string, kind: 'video' | 'audio') {
  const match = String(html || '').match(new RegExp(`<${kind}\\b([^>]*)>([\\s\\S]*?)<\\/${kind}>`, 'i'));
  if (!match) return '';
  return readMediaAttribute(match[1] || '', 'src') || readMediaAttribute(match[2]?.match(/<source\b([^>]*)>/i)?.[1] || '', 'src');
}
