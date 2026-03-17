import apiDocs from "~/utilities/apiDocs";

export type CurriculumLexicon = {
  terms: Set<string>;
  tokens: Set<string>;
  loadedAt: number;
  source: "remote" | "fallback";
};

const LEXICON_TTL_MS = 5 * 60 * 1000;
const TOKEN_STOPWORDS = new Set([
  "chapter",
  "form",
  "introduction",
  "basic",
  "basics",
  "general",
  "topic",
  "topics",
  "section",
  "sections",
  "study",
  "studies",
  "practical",
  "teacher",
  "student",
  "students",
  "syllabus",
]);

let lexiconCache:
  | { expiresAt: number; value: CurriculumLexicon }
  | null = null;
let inflightLexiconPromise: Promise<CurriculumLexicon> | null = null;

function getBaseURL() {
  const envUrl = process.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  if (apiDocs.baseURL) return apiDocs.baseURL;
  throw new Error("VITE_API_BASE_URL is not set and apiDocs.baseURL is not available");
}

function resolveApiUrl(docUrl: string, fallbackPath: string) {
  const baseUrl = getBaseURL();
  if (docUrl && !docUrl.includes("undefined")) {
    return docUrl.replace(apiDocs.baseURL || baseUrl, baseUrl);
  }
  return `${baseUrl}${fallbackPath}`;
}

function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addTerm(terms: Set<string>, tokens: Set<string>, rawValue: string) {
  const normalized = normalizeTerm(rawValue);
  if (!normalized) return;

  terms.add(normalized);

  normalized.split(/\s+/).forEach((token) => {
    if (token.length < 5) return;
    if (TOKEN_STOPWORDS.has(token)) return;
    tokens.add(token);
  });
}

function normalizeTopicList(topics: any[]) {
  return topics
    .map((topic) => {
      if (typeof topic === "string") return topic;
      return topic?.title || topic?.name || topic?.topic || topic?.topicName || "";
    })
    .filter((topic: string) => topic.trim().length > 0);
}

function buildChaptersFromSubject(subject: any) {
  const chaptersRaw =
    subject?.chapters ||
    subject?.chapterList ||
    subject?.syllabus?.chapters ||
    subject?.book?.chapters ||
    [];

  if (Array.isArray(chaptersRaw) && chaptersRaw.length > 0) {
    return chaptersRaw.map((chapter: any) => ({
      title: chapter?.title || chapter?.name || "",
      fullTitle: chapter?.fullTitle || "",
      topics: normalizeTopicList(
        chapter?.sections || chapter?.topics || chapter?.subtopics || []
      ),
    }));
  }

  const topicsRaw = subject?.topics || subject?.topicList || [];
  if (!Array.isArray(topicsRaw) || topicsRaw.length === 0) {
    return [];
  }

  const grouped = new Map<string, { title: string; topics: string[] }>();

  topicsRaw.forEach((topic: any, index: number) => {
    const chapterTitle =
      topic?.chapterName ||
      topic?.chapterTitle ||
      topic?.chapter?.title ||
      topic?.chapter ||
      `chapter-${index + 1}`;

    if (!grouped.has(chapterTitle)) {
      grouped.set(chapterTitle, {
        title: chapterTitle,
        topics: [],
      });
    }

    const topicName =
      topic?.title || topic?.name || topic?.topic || topic?.topicName || "";
    if (topicName) {
      grouped.get(chapterTitle)?.topics.push(topicName);
    }
  });

  return Array.from(grouped.values()).map((entry) => ({
    title: entry.title,
    fullTitle: entry.title,
    topics: entry.topics,
  }));
}

async function fetchJson(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchSubjectsList(token?: string): Promise<any[]> {
  const subjectsUrl = resolveApiUrl(apiDocs.subjects.getSubjects, "/subjects");
  const publicSubjectsUrl = resolveApiUrl(
    apiDocs.subjects.getPublicSubjects,
    "/public-subjects"
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const extractList = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.subjects)) return data.subjects;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const response = await fetch(subjectsUrl, { headers });
  if (response.ok) {
    return extractList(await response.json());
  }

  if ((response.status === 401 || response.status === 403) && !token?.trim()) {
    const publicResponse = await fetch(publicSubjectsUrl, {
      headers: { "Content-Type": "application/json" },
    });
    if (publicResponse.ok) {
      return extractList(await publicResponse.json());
    }
  }

  throw new Error(`API returned ${response.status}: ${response.statusText}`);
}

async function buildLexiconFromApi(token?: string): Promise<CurriculumLexicon> {
  const terms = new Set<string>();
  const tokens = new Set<string>();
  const subjectList = await fetchSubjectsList(token);

  for (const subject of subjectList) {
    const subjectId = subject?._id || subject?.id || subject?.subjectId || "";
    const name = subject?.name || subject?.title || subject?.subject || "";
    const level = subject?.level || subject?.classLevel || subject?.educationLevel || "";

    addTerm(terms, tokens, name);
    addTerm(terms, tokens, `${name} ${level}`.trim());

    let chapters = buildChaptersFromSubject(subject);

    if (!chapters.length && subjectId) {
      try {
        const detailUrl = resolveApiUrl(
          apiDocs.subjects.getSubjectId.replace(":id", subjectId),
          `/subjects/${subjectId}`
        );
        const detail = await fetchJson(detailUrl, token);
        chapters = buildChaptersFromSubject(detail);
      } catch {
        chapters = [];
      }
    }

    chapters.forEach((chapter) => {
      addTerm(terms, tokens, chapter.title);
      addTerm(terms, tokens, chapter.fullTitle);
      chapter.topics.forEach((topic) => addTerm(terms, tokens, topic));
    });
  }

  return {
    terms,
    tokens,
    loadedAt: Date.now(),
    source: "remote",
  };
}

function buildFallbackLexicon(): CurriculumLexicon {
  const terms = new Set<string>();
  const tokens = new Set<string>();

  [
    "physics",
    "chemistry",
    "biology",
    "mathematics",
    "math",
    "geography",
    "history",
    "civics",
    "english",
    "kiswahili",
    "swahili",
    "science",
    "agriculture",
    "computer studies",
    "ict",
  ].forEach((term) => addTerm(terms, tokens, term));

  return {
    terms,
    tokens,
    loadedAt: Date.now(),
    source: "fallback",
  };
}

export async function getCurriculumLexicon(token?: string): Promise<CurriculumLexicon> {
  const now = Date.now();
  if (lexiconCache && lexiconCache.expiresAt > now) {
    return lexiconCache.value;
  }

  if (inflightLexiconPromise) {
    return inflightLexiconPromise;
  }

  inflightLexiconPromise = buildLexiconFromApi(token)
    .catch(() => buildFallbackLexicon())
    .then((value) => {
      lexiconCache = {
        value,
        expiresAt: Date.now() + LEXICON_TTL_MS,
      };
      inflightLexiconPromise = null;
      return value;
    })
    .catch((error) => {
      inflightLexiconPromise = null;
      throw error;
    });

  return inflightLexiconPromise;
}
