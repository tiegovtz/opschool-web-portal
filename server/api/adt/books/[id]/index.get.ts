import { z } from 'zod';
import { adtLevelHub, type AdtReaderBook } from '../../../../../shared/adt/catalogue';
import { adtBookSchema, adtClassificationSchemas, adtFetch, adtIdSchema, isPublishedAdtBook, toLearnerAdtBook } from '../../../../utils/adtStore';

export default defineEventHandler(async (event): Promise<AdtReaderBook> => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const input = z.object({
    id: adtIdSchema,
    educationLevel: z.enum(['primary', 'secondary']),
  }).safeParse({ ...getQuery(event), id: getRouterParam(event, 'id') });
  if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Invalid book or education level.' });
  const { id, educationLevel } = input.data;
  const [book, levels] = await Promise.all([
    adtFetch(`/api/v1/books/${encodeURIComponent(id)}`, adtBookSchema),
    adtFetch('/api/v1/data/levels', adtClassificationSchemas.levels),
  ]);
  if (book.id !== id || !isPublishedAdtBook(book) || !levels.some(level => book.levelIds.includes(level.id) && adtLevelHub(level.name) === educationLevel)) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found.' });
  }
  const origin = getRequestURL(event).origin;
  const reader = await adtFetch(`/api/v1/books/${encodeURIComponent(id)}/reader?embedOrigin=${encodeURIComponent(origin)}`, z.object({
    url: z.string().url().refine(value => {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
        && !url.search && !url.hash && url.pathname.startsWith(`/api/library/${encodeURIComponent(id)}/preview/reader.`);
    }),
    expiresAt: z.string().datetime(),
  }), 'ADT Store reader permission is not enabled.');
  return { book: toLearnerAdtBook(book), preview: false, readerAvailable: true, reader };
});
