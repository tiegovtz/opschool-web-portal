export type AdtHub = 'primary' | 'secondary';
export type AdtOption = { id: string; name: string };
export type AdtLevel = AdtOption & { classIds: string[]; subjectIds: string[] };
export type AdtClass = AdtOption & { levelIds: string[]; subjectIds: string[] };
export type AdtSubject = AdtOption & { levelIds: string[]; classIds: string[] };
export type AdtClassifications = {
  levels: AdtLevel[];
  classes: AdtClass[];
  subjects: AdtSubject[];
  languages: AdtOption[];
  curricula: AdtOption[];
};
export type AdtBook = {
  id: string;
  title: string;
  isbn?: string;
  levelIds: string[];
  classIds: string[];
  subjectIds: string[];
  curriculumIds: string[];
  languageId?: string;
  language: string;
  features: string[];
  pages?: number;
  coverUrl: string | null;
};
export type AdtReaderBook = { book: AdtBook; preview: boolean; readerAvailable: true; reader: { url: string; expiresAt: string } };
export type AdtCatalogue = AdtClassifications & {
  configured: boolean;
  preview: boolean;
  books: AdtBook[];
};
export type AdtFilters = {
  level: string;
  class: string;
  subject: string;
  language: string;
  curriculum: string;
  search: string;
};

export const emptyAdtFilters = (): AdtFilters => ({
  level: '', class: '', subject: '', language: '', curriculum: '', search: '',
});

// Explicit mapping: unknown/custom levels are never silently treated as secondary.
export function adtLevelHub(name: string): AdtHub | null {
  const value = name.trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  if (['primary', 'pre primary', 'primary education', 'elimu ya msingi', 'elimu ya awali'].includes(value)) return 'primary';
  if (['ordinary secondary', 'advanced secondary', 'lower secondary', 'upper secondary', 'secondary'].includes(value)) return 'secondary';
  return null;
}

export const sortAdtOptions = <T extends AdtOption>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

export function scopeAdtCatalogue(catalogue: AdtCatalogue, hub: AdtHub): AdtCatalogue {
  const levels = sortAdtOptions(catalogue.levels.filter(level => adtLevelHub(level.name) === hub));
  const levelIds = new Set(levels.map(level => level.id));
  return {
    ...catalogue,
    levels,
    classes: sortAdtOptions(catalogue.classes.filter(item => item.levelIds.some(id => levelIds.has(id)))),
    subjects: sortAdtOptions(catalogue.subjects.filter(item => item.levelIds.some(id => levelIds.has(id)))),
    languages: sortAdtOptions(catalogue.languages),
    curricula: sortAdtOptions(catalogue.curricula),
    books: catalogue.books.filter(book => book.levelIds.some(id => levelIds.has(id))),
  };
}

export function adtClassOptions(catalogue: AdtClassifications, level = '') {
  return level ? catalogue.classes.filter(item => item.levelIds.includes(level)) : catalogue.classes;
}

export function adtSubjectOptions(catalogue: AdtClassifications, level: string, classId: string) {
  const validClass = catalogue.classes.some(item => item.id === classId && (!level || item.levelIds.includes(level)));
  return classId && validClass
    ? catalogue.subjects.filter(item => (!level || item.levelIds.includes(level)) && item.classIds.includes(classId))
    : [];
}

export function filterAdtBooks(catalogue: AdtCatalogue, filters: AdtFilters): AdtBook[] {
  const names = new Map([
    ...catalogue.levels, ...catalogue.classes, ...catalogue.subjects, ...catalogue.curricula,
  ].map(item => [item.id, item.name]));
  const terms = filters.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return catalogue.books.filter(book => {
    if (filters.level && !book.levelIds.includes(filters.level)) return false;
    if (filters.class && !book.classIds.includes(filters.class)) return false;
    if (filters.subject && !book.subjectIds.includes(filters.subject)) return false;
    if (filters.language && book.languageId !== filters.language) return false;
    if (filters.curriculum && !book.curriculumIds.includes(filters.curriculum)) return false;
    const text = [book.title, book.isbn, book.language,
      ...[...book.levelIds, ...book.classIds, ...book.subjectIds, ...book.curriculumIds].map(id => names.get(id)),
    ].filter(Boolean).join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
}
