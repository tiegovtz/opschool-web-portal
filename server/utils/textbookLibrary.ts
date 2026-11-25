import { normalizeClassLevel, normalizeSubjectName, type TextbookCatalog, type TextbookScope } from './textbookScope';

export type TextbookLibraryEntry = {
  title: string;
  subject: string;
  level: string;
  subjectId: string;
  classLevelId: string;
  chunkCount: number | null;
};

/** Expose book metadata only, never stored files or provider configuration. */
export function matchTextbookLibrary(documents: unknown[], scope: TextbookScope, catalog: TextbookCatalog): TextbookLibraryEntry[] {
  return documents.flatMap((value: any) => {
    if (!value || typeof value.title !== 'string' || !value.title.trim()) return [];
    const subjectId = typeof value.subject === 'string' ? value.subject : '';
    const classLevelId = typeof value.classLevel === 'string' ? value.classLevel : '';
    const subject = catalog.subjects.find(item => item._id === subjectId)?.name || subjectId;
    const level = catalog.levels.find(item => item._id === classLevelId)?.name || classLevelId;
    if (scope.subject && scope.subject !== subjectId && normalizeSubjectName(scope.subject) !== normalizeSubjectName(subject)) return [];
    if (scope.level && scope.level !== classLevelId && normalizeClassLevel(scope.level) !== normalizeClassLevel(level)) return [];
    return [{ title: value.title.trim(), subject, level, subjectId, classLevelId,
      chunkCount: typeof value.chunkCount === 'number' ? value.chunkCount : null }];
  });
}

export async function loadTextbookLibrary(): Promise<unknown[]> {
  const config = useRuntimeConfig();
  const base = String(config.ragApiBaseUrl || '').trim().replace(/\/+$/, '');
  const key = String(config.insightsApiKey || '').trim();
  if (!base || !key) throw new Error('Textbook library is not configured.');
  const response = await fetch(`${base}/rag/documents`, {
    headers: { 'X-API-Key': key }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Textbook library is unavailable (HTTP ${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Textbook library returned an invalid response.');
  return data;
}
