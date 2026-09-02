import { z } from 'zod';
import type { AdtBook, AdtCatalogue } from '../../shared/adt/catalogue';

export const adtIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
const ids = z.array(adtIdSchema);
const option = z.object({ id: adtIdSchema, name: z.string() });
export const adtBookSchema = z.object({
  id: adtIdSchema, title: z.string(), isbn: z.string().optional(),
  levelIds: ids, classIds: ids, subjectIds: ids, curriculumIds: ids,
  languageId: adtIdSchema.optional(), language: z.string(),
  features: z.array(z.string()), pages: z.number().nonnegative().optional(),
  status: z.string(), approvalStatusValue: z.string(),
  coverThumbnail: z.object({ url: z.string(), mimeType: z.string() }).nullable(),
});
export const adtClassificationSchemas = {
  levels: z.array(option.extend({ classIds: ids, subjectIds: ids })),
  classes: z.array(option.extend({ levelIds: ids, subjectIds: ids })),
  subjects: z.array(option.extend({ levelIds: ids, classIds: ids })),
  languages: z.array(option),
  curricula: z.array(option),
};

export function adtConfigured() {
  const config = useRuntimeConfig();
  return Boolean(config.adtStoreBaseUrl && config.adtStoreApiKey);
}

export function emptyAdtCatalogue(): AdtCatalogue {
  return { configured: false, preview: false, books: [], levels: [], classes: [], subjects: [], languages: [], curricula: [] };
}

export function adtRequestOptions(path: string) {
  const config = useRuntimeConfig();
  const base = adtStoreBaseUrl();
  return {
    url: `${base.toString().replace(/\/$/, '')}${path}`,
    options: {
      headers: { Authorization: `Bearer ${config.adtStoreApiKey}` },
      timeout: 10000, retry: 0, redirect: 'error' as const,
    },
  };
}

export function adtStoreBaseUrl() {
  const config = useRuntimeConfig();
  if (!adtConfigured()) throw createError({ statusCode: 503, statusMessage: 'ADT Store is not configured.' });
  let base: URL;
  try {
    base = new URL(String(config.adtStoreBaseUrl));
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
    // Accept either the Store origin or its documented API base URL.
    base.pathname = base.pathname.replace(/\/api\/v1\/?$/, '/');
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'ADT Store configuration is invalid.' });
  }
  return base;
}

export async function adtFetch<T>(path: string, schema: z.ZodType<T>, forbiddenMessage?: string): Promise<T> {
  const { url, options } = adtRequestOptions(path);
  try {
    const result = await $fetch<unknown>(url, options);
    return z.object({ data: schema }).parse(result).data as T;
  } catch (error) {
    // Do not serialize upstream errors: they may include Authorization headers or staff metadata.
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 502, statusMessage: 'ADT Store returned an incompatible response.' });
    }
    if (forbiddenMessage && error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 403) {
      throw createError({ statusCode: 403, statusMessage: forbiddenMessage });
    }
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: 'ADT resource not found.' });
    }
    throw createError({ statusCode: 502, statusMessage: 'ADT Store is unavailable. Please try again later.' });
  }
}

export function isPublishedAdtBook(book: z.infer<typeof adtBookSchema>) {
  return book.status === 'Ready' && book.approvalStatusValue === 'final_approved';
}

export function toLearnerAdtBook(book: z.infer<typeof adtBookSchema>): AdtBook {
  return {
    id: book.id, title: book.title, isbn: book.isbn,
    levelIds: book.levelIds, classIds: book.classIds, subjectIds: book.subjectIds,
    curriculumIds: book.curriculumIds, languageId: book.languageId,
    language: book.language, features: book.features, pages: book.pages,
    // Never follow an upstream-supplied URL or reveal the integration key to an <img>.
    coverUrl: book.coverThumbnail ? `/api/adt/books/${encodeURIComponent(book.id)}/cover` : null,
  };
}
