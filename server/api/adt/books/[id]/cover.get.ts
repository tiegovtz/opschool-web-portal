import { adtBookSchema, adtFetch, adtIdSchema, adtRequestOptions, isPublishedAdtBook } from '../../../../utils/adtStore';

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const id = adtIdSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) throw createError({ statusCode: 400, statusMessage: 'Invalid book identifier.' });
  const path = `/api/v1/books/${encodeURIComponent(id.data)}`;
  const book = await adtFetch(path, adtBookSchema);
  if (!isPublishedAdtBook(book) || !book.coverThumbnail) {
    throw createError({ statusCode: 404, statusMessage: 'Book cover is unavailable.' });
  }
  const { url, options } = adtRequestOptions(`${path}/cover`);
  try {
    const response = await $fetch.raw<ArrayBuffer>(url, { ...options, responseType: 'arrayBuffer' });
    const mime = response.headers.get('content-type')?.split(';')[0];
    if (!mime || !['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(mime) || !response._data) throw new Error();
    setHeader(event, 'Content-Type', mime);
    setHeader(event, 'X-Content-Type-Options', 'nosniff');
    return new Uint8Array(response._data);
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Book cover is unavailable.' });
  }
});
