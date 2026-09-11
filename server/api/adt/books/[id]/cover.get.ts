import { z } from 'zod';
import { adtBookSchema, adtFetch, adtIdSchema, adtRequestOptions, isPublishedAdtBook } from '../../../../utils/adtStore';

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const id = adtIdSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) throw createError({ statusCode: 400, statusMessage: 'Invalid book identifier.' });
  const query = z.object({
    variant: z.literal('thumbnail').optional(),
    v: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  }).safeParse(getQuery(event));
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid cover variant.' });
  const path = `/api/v1/books/${encodeURIComponent(id.data)}`;
  const book = await adtFetch(path, adtBookSchema);
  if (book.id !== id.data || !isPublishedAdtBook(book) || !book.coverThumbnail) {
    throw createError({ statusCode: 404, statusMessage: 'Book cover is unavailable.' });
  }
  const params = new URLSearchParams();
  if (query.data.variant) params.set('variant', query.data.variant);
  if (query.data.v) params.set('v', query.data.v);
  const { url, options } = adtRequestOptions(`${path}/cover${params.size ? `?${params}` : ''}`);
  const etag = getRequestHeader(event, 'if-none-match');
  try {
    const response = await $fetch.raw<ArrayBuffer>(url, {
      ...options, responseType: 'arrayBuffer',
      headers: { ...options.headers, Accept: 'image/*', ...(etag ? { 'If-None-Match': etag } : {}) },
    });
    // Every revalidation still checks publication eligibility and the cover grant.
    if (response.status === 304 && etag) {
      setHeader(event, 'Cache-Control', 'private, no-cache');
      setHeader(event, 'ETag', response.headers.get('etag') || etag);
      setResponseStatus(event, 304);
      return null;
    }
    const mime = response.headers.get('content-type')?.split(';')[0];
    if (response.status !== 200 || !mime || !['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(mime) || !response._data?.byteLength) throw new Error();
    setHeader(event, 'Cache-Control', 'private, no-cache');
    if (response.headers.get('etag')) setHeader(event, 'ETag', response.headers.get('etag')!);
    setHeader(event, 'Content-Type', mime);
    setHeader(event, 'X-Content-Type-Options', 'nosniff');
    return new Uint8Array(response._data);
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Book cover is unavailable.' });
  }
});
