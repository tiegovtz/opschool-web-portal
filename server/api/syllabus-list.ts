import { getCookie } from "h3";
import apiDocs from "~/utilities/apiDocs";

interface SubjectData {
  id: string;
  name: string;
  level: string;
  chapters: Array<{
    number: number;
    title: string;
    fullTitle: string;
    topics: string[];
  }>;
}

const getBaseURL = () => {
  const envUrl = process.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  if (apiDocs.baseURL) return apiDocs.baseURL;
  throw new Error("VITE_API_BASE_URL is not set and apiDocs.baseURL is not available");
};

const resolveApiUrl = (docUrl: string, fallbackPath: string) => {
  const baseUrl = getBaseURL();
  if (docUrl && !docUrl.includes("undefined")) {
    return docUrl.replace(apiDocs.baseURL || baseUrl, baseUrl);
  }
  return `${baseUrl}${fallbackPath}`;
};

const numberToWord = (num: number) => {
  const numberWords: Record<number, string> = {
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
  };
  return numberWords[num] || String(num);
};

const normalizeTopicList = (topics: any[]) =>
  topics
    .map((topic) => {
      if (typeof topic === "string") return topic;
      return topic?.title || topic?.name || topic?.topic || topic?.topicName || "";
    })
    .filter((topic: string) => topic.trim().length > 0);

const buildChaptersFromSubject = (subject: any): SubjectData["chapters"] => {
  const chaptersRaw =
    subject?.chapters ||
    subject?.chapterList ||
    subject?.syllabus?.chapters ||
    subject?.book?.chapters ||
    [];

  if (Array.isArray(chaptersRaw) && chaptersRaw.length > 0) {
    return chaptersRaw.map((chapter: any, index: number) => {
      const number =
        Number(
          chapter?.chapter_number ||
            chapter?.chapterNumber ||
            chapter?.number ||
            chapter?.order ||
            index + 1
        ) ||
        index + 1;
      const title = chapter?.title || chapter?.name || `Chapter ${number}`;
      const topics = normalizeTopicList(chapter?.sections || chapter?.topics || chapter?.subtopics || []);
      const fullTitle =
        chapter?.fullTitle ||
        (title.toLowerCase().startsWith("chapter")
          ? title
          : `Chapter ${numberToWord(number)}: ${title}`);

      return {
        number,
        title,
        fullTitle,
        topics,
      };
    });
  }

  const topicsRaw = subject?.topics || subject?.topicList || [];
  if (Array.isArray(topicsRaw) && topicsRaw.length > 0) {
    const grouped = new Map<string, { number: number; title: string; topics: string[] }>();

    topicsRaw.forEach((topic: any, index: number) => {
      const chapterTitle =
        topic?.chapterName ||
        topic?.chapterTitle ||
        topic?.chapter?.title ||
        topic?.chapter ||
        "";
      const chapterNumber =
        Number(
          topic?.chapterNumber ||
            topic?.chapter?.chapter_number ||
            topic?.chapter?.number ||
            index + 1
        ) ||
        index + 1;
      const key = chapterTitle || `chapter-${chapterNumber}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          number: chapterNumber,
          title: chapterTitle || `Chapter ${chapterNumber}`,
          topics: [],
        });
      }

      const topicName =
        topic?.title || topic?.name || topic?.topic || topic?.topicName || "";
      if (topicName) {
        grouped.get(key)?.topics.push(topicName);
      }
    });

    return Array.from(grouped.values()).map((entry) => ({
      number: entry.number,
      title: entry.title,
      fullTitle: entry.title.toLowerCase().startsWith("chapter")
        ? entry.title
        : `Chapter ${numberToWord(entry.number)}: ${entry.title}`,
      topics: entry.topics,
    }));
  }

  return [];
};

async function fetchJson(url: string, token?: string | null): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: `API returned ${response.status}: ${response.statusText}`,
    });
  }

  return response.json();
}

async function fetchSubjectsList(token?: string | null): Promise<any[]> {
  const subjectsUrl = resolveApiUrl(apiDocs.subjects.getSubjects, "/subjects");
  const publicSubjectsUrl = resolveApiUrl(apiDocs.subjects.getPublicSubjects, "/public-subjects");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
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

  if ((response.status === 401 || response.status === 403) && !token) {
    const publicResponse = await fetch(publicSubjectsUrl, { headers: { "Content-Type": "application/json" } });
    if (publicResponse.ok) {
      return extractList(await publicResponse.json());
    }
  }

  throw createError({
    statusCode: response.status,
    message: `API returned ${response.status}: ${response.statusText}`,
  });
}

/**
 * GET /api/syllabus-list
 * Returns all available subjects with their chapters and topics
 * for use in cascading dropdowns
 */
export default defineEventHandler(async (event) => {
  try {
    const authToken =
      getCookie(event, "signInAccessToken") ||
      getCookie(event, "token") ||
      undefined;

    const subjectList = await fetchSubjectsList(authToken);

    const subjects: SubjectData[] = [];

    for (const subject of subjectList) {
      const subjectId = subject?._id || subject?.id || subject?.subjectId || "";
      const name = subject?.name || subject?.title || subject?.subject || "Subject";
      const level = subject?.level || subject?.classLevel || subject?.educationLevel || "";
      const displayName = level ? `${name} ${level}` : name;

      let chapters = buildChaptersFromSubject(subject);

      if (!chapters.length && subjectId) {
        try {
          const subjectDetailUrl = resolveApiUrl(
            apiDocs.subjects.getSubjectId.replace(":id", subjectId),
            `/subjects/${subjectId}`
          );
          const detail = await fetchJson(subjectDetailUrl, authToken);
          chapters = buildChaptersFromSubject(detail) || [];
        } catch {
          chapters = [];
        }
      }

      subjects.push({
        id: subjectId || `${name}_${level || "unknown"}`,
        name: displayName,
        level: level || "",
        chapters,
      });
    }

    subjects.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      total: subjects.length,
      subjects,
    };
  } catch (error: any) {
    console.error("[syllabus-list] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to load syllabus data",
    });
  }
});
