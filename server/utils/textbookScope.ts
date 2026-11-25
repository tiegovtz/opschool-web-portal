export type TextbookScope = { subject?: string; level?: string };
export type CatalogEntry = { _id: string; name: string; educationLevel?: string | { _id: string } };
export type TextbookCatalog = { subjects: CatalogEntry[]; levels: CatalogEntry[] };

const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const areaId = (item: CatalogEntry) => typeof item.educationLevel === 'string' ? item.educationLevel : item.educationLevel?._id;

export class TextbookScopeError extends Error {
  readonly code: 'missing_scope' | 'invalid_level' | 'invalid_subject' | 'ambiguous_scope';

  constructor(code: TextbookScopeError['code'], message: string) {
    super(message);
    this.name = 'TextbookScopeError';
    this.code = code;
  }
}

const classNumbers = [
  ['1', 'one', 'first', 'i', 'kwanza', 'moja'],
  ['2', 'two', 'second', 'ii', 'pili', 'mbili'],
  ['3', 'three', 'third', 'iii', 'tatu'],
  ['4', 'four', 'fourth', 'iv', 'nne'],
  ['5', 'five', 'fifth', 'v', 'tano'],
  ['6', 'six', 'sixth', 'vi', 'sita'],
  ['7', 'seven', 'seventh', 'vii', 'saba'],
  ['8', 'eight', 'eighth', 'viii', 'nane'],
  ['9', 'nine', 'ninth', 'ix', 'tisa'],
  ['10', 'ten', 'tenth', 'x', 'kumi'],
];
const numberPattern = classNumbers.flat().sort((a, b) => b.length - a.length).join('|');
const classPattern = `\\b(form|kidato|standard|grade|darasa)\\s*(?:(?:cha|la)\\s+)?(${numberPattern}|\\d+)\\b`;

/** Alias matching never conflates secondary forms with primary standards. */
export function normalizeClassLevel(value: string): string {
  const text = normalize(value);
  const match = new RegExp(`^${classPattern}$`, 'i').exec(text);
  if (!match) return text;
  const number = classNumbers.findIndex(aliases => aliases.includes(match[2]!));
  const stage = ['form', 'kidato'].includes(match[1]!) ? 'form' : 'standard';
  return `${stage} ${number >= 0 ? number + 1 : match[2]}`;
}

// Retain all meaningful words; only equivalent connectors may be omitted.
export const normalizeSubjectName = (value: string) => normalize(value).split(' ')
  .filter(word => !['ya', 'na', 'and'].includes(word)).join(' ');

/**
 * Carry explicitly named subjects/classes through follow-ups. Only user text
 * belongs here: a model's earlier answer must never set the student's class.
 * A selected lesson remains authoritative; general chat can change class.
 */
export function resolveConversationTextbookScope(
  userMessages: readonly string[], selected: TextbookScope, catalog: TextbookCatalog,
): TextbookScope {
  let subjects: string[] = [];
  let levels: string[] = [];
  for (const message of userMessages) {
    const text = normalize(message);
    const namedLevels = [
      ...Array.from(text.matchAll(new RegExp(classPattern, 'gi')), match => normalizeClassLevel(match[0])),
      ...catalog.levels.filter(item => ` ${text} `.includes(` ${normalize(item.name)} `))
        .map(item => normalizeClassLevel(item.name)),
    ];
    if (namedLevels.length) levels = [...new Set(namedLevels)];

    // "Explain in Kiswahili" changes the response language, not the subject.
    const subjectText = normalizeSubjectName(text.replace(/\b(?:in|into|to|kwa)\s+(?:english|kiswahili|swahili)\b/g, ' '));
    const namedSubjects = [...new Set(catalog.subjects.map(item => normalizeSubjectName(item.name)))]
      .filter(name => name && ` ${subjectText} `.includes(` ${name} `));
    const longestNames = namedSubjects.filter(name => !namedSubjects.some(other => other !== name && ` ${other} `.includes(` ${name} `)));
    if (longestNames.length) subjects = longestNames;
  }
  if ((!selected.subject && subjects.length > 1) || (!selected.level && levels.length > 1)) {
    throw new TextbookScopeError('ambiguous_scope', 'Please specify one subject and class level for this question.');
  }
  return {
    subject: selected.subject?.trim() || subjects[0],
    level: selected.level?.trim() || levels[0],
  };
}

export function resolveTextbookScope(input: TextbookScope, selected: TextbookScope, catalog: TextbookCatalog) {
  const level = selected.level?.trim() || input.level?.trim();
  const subject = selected.subject?.trim() || input.subject?.trim();
  if (!level || !subject) throw new TextbookScopeError('missing_scope', `Please specify ${!level && !subject ? 'the subject and class level' : !level ? 'the class level' : 'the subject'} for this question.`);
  const levels = catalog.levels.filter(item => item._id === level || normalizeClassLevel(item.name) === normalizeClassLevel(level));
  const selectedLevel = levels[0];
  if (levels.length !== 1 || !selectedLevel) throw new TextbookScopeError('invalid_level', 'Please select a valid, unambiguous class level.');
  const area = areaId(selectedLevel);
  const subjects = catalog.subjects.filter(item =>
    (item._id === subject || normalizeSubjectName(item.name) === normalizeSubjectName(subject)) && area && areaId(item) === area);
  const selectedSubject = subjects[0];
  if (subjects.length !== 1 || !selectedSubject) throw new TextbookScopeError('invalid_subject', 'Please select a subject available for that class level.');
  return { classLevel: selectedLevel._id, subject: selectedSubject._id };
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
