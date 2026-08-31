import { z } from 'zod';
import { scopeAdtCatalogue } from '../../../shared/adt/catalogue';
import { adtBookSchema, adtClassificationSchemas, adtConfigured, adtFetch, emptyAdtCatalogue, isPublishedAdtBook, toLearnerAdtBook } from '../../utils/adtStore';

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const query = z.object({ educationLevel: z.enum(['primary', 'secondary']) }).safeParse(getQuery(event));
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Select primary or secondary education.' });
  if (!adtConfigured()) return emptyAdtCatalogue();
  const [books, levels, classes, subjects, languages, curricula] = await Promise.all([
    adtFetch('/api/v1/books', z.array(adtBookSchema)),
    adtFetch('/api/v1/data/levels', adtClassificationSchemas.levels),
    adtFetch('/api/v1/data/classes', adtClassificationSchemas.classes),
    adtFetch('/api/v1/data/subjects', adtClassificationSchemas.subjects),
    adtFetch('/api/v1/data/languages', adtClassificationSchemas.languages),
    adtFetch('/api/v1/data/curricula', adtClassificationSchemas.curricula),
  ]);
  return scopeAdtCatalogue({ configured: true, preview: false,
    books: books.filter(isPublishedAdtBook).map(toLearnerAdtBook),
    levels, classes, subjects, languages, curricula,
  }, query.data.educationLevel);
});
