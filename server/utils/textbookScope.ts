export type TextbookScope = { subject?: string; level?: string };
type CatalogEntry = { _id: string; name: string; educationLevel?: string | { _id: string } };
export type TextbookCatalog = { subjects: CatalogEntry[]; levels: CatalogEntry[] };

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const areaId = (item: CatalogEntry) => typeof item.educationLevel === 'string' ? item.educationLevel : item.educationLevel?._id;

export function resolveTextbookScope(input: TextbookScope, selected: TextbookScope, catalog: TextbookCatalog) {
  const level = selected.level?.trim() || input.level?.trim();
  const subject = selected.subject?.trim() || input.subject?.trim();
  if (!level || !subject) throw new Error('Please specify the subject and class level for this question.');
  const levels = catalog.levels.filter(item => item._id === level || normalize(item.name) === normalize(level));
  if (levels.length !== 1) throw new Error('Please select a valid, unambiguous class level.');
  const area = areaId(levels[0]);
  const subjects = catalog.subjects.filter(item =>
    (item._id === subject || normalize(item.name) === normalize(subject)) && area && areaId(item) === area);
  if (subjects.length !== 1) throw new Error('Please select a subject available for that class level.');
  return { classLevel: levels[0]._id, subject: subjects[0]._id };
}

export async function loadTextbookCatalog(base: string, token?: string): Promise<TextbookCatalog> {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const read = async (path: string) => {
    const res = await fetch(`${base.replace(/\/$/, '')}${path}`, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('The subject/class catalog is unavailable. Please try again.');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('The subject/class catalog returned an invalid response.');
    return data;
  };
  const [subjects, levels] = await Promise.all([read('/subjects'), read('/levels')]);
  return { subjects, levels };
}
