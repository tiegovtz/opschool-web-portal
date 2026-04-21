import { AsyncLocalStorage } from "node:async_hooks";
import { tool } from "ai";
import { z } from "zod";
import {
  parse as mathParse,
  simplify as mathSimplify,
  derivative as mathDerivative,
  rationalize as mathRationalize,
  evaluate as mathEvaluate,
} from "mathjs";
import { fetchCombinedRAGContext } from "../../utils/rag";
import apiDocs from "~/utilities/apiDocs";
import type { Syllabus } from "~/types/syllabus.interface";

let currentAuthToken: string | undefined = undefined;

const figureShortcodesStorage = new AsyncLocalStorage<{ usedShortcodes: Set<string> }>();

export function runWithUsedFigureShortcodes<T>(usedShortcodes: Set<string>, fn: () => T): T {
  return figureShortcodesStorage.run({ usedShortcodes }, fn);
}

function getUsedFigureShortcodes(): Set<string> {
  const store = figureShortcodesStorage.getStore();
  return store?.usedShortcodes ?? new Set();
}

const SYLLABUS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const syllabusCache = new Map<
  string,
  { timestamp: number; value: any }
>();

const SYLLABUS_SUBJECTS: Array<{ _id: string; name: string }> = [
  { _id: "665865487b076d51f6fc037a", name: "Physics" },
  { _id: "665865867b076d51f6fc037f", name: "Chemistry" },
  { _id: "6658658d7b076d51f6fc0381", name: "Biology" },
  { _id: "665865967b076d51f6fc0383", name: "Geography" },
  { _id: "67f50a3fb88b1b7c13b40b40", name: "Mathematics" },
  { _id: "695f54ae50ae29af5c1968d8", name: "Horticulture Attendant" },
  { _id: "696e182925b5df0cc3330d19", name: "English" },
];

const SYLLABUS_LEVELS: Array<{
  _id: string;
  name: string;
  educationLevel: { _id: string; name: string };
}> = [
  { _id: "66571e097b076d51f6fb9fc5", name: "Form 1", educationLevel: { _id: "681afda6b6583d2ea309f83e", name: "Lower Secondary" } },
  { _id: "6658663a7b076d51f6fc038b", name: "Form 2", educationLevel: { _id: "681afda6b6583d2ea309f83e", name: "Lower Secondary" } },
  { _id: "665867b57b076d51f6fc039e", name: "Form 3", educationLevel: { _id: "681afda6b6583d2ea309f83e", name: "Lower Secondary" } },
  { _id: "665867be7b076d51f6fc03a0", name: "Form 4", educationLevel: { _id: "681afda6b6583d2ea309f83e", name: "Lower Secondary" } },
  { _id: "692fef2fe621c5077be4018a", name: "Form 5", educationLevel: { _id: "681afdb4b6583d2ea309f849", name: "Upper Secondary" } },
  { _id: "692fef90e621c5077be401b1", name: "Form 6", educationLevel: { _id: "681afdb4b6583d2ea309f849", name: "Upper Secondary" } },
  { _id: "692ff01be621c5077be401fc", name: "Diploma in Special Education", educationLevel: { _id: "681afdc3b6583d2ea309f850", name: "Teacher Education" } },
  { _id: "692ff043e621c5077be40209", name: "Diploma in Primary Education", educationLevel: { _id: "681afdc3b6583d2ea309f850", name: "Teacher Education" } },
  { _id: "692ff05de621c5077be40217", name: "Diploma in Pre-primary Education", educationLevel: { _id: "681afdc3b6583d2ea309f850", name: "Teacher Education" } },
  { _id: "692ff082e621c5077be40224", name: "Diploma in Special Education", educationLevel: { _id: "681afdc3b6583d2ea309f850", name: "Teacher Education" } },
  { _id: "692ff09ae621c5077be40231", name: "Diploma in Pysical Education", educationLevel: { _id: "681afdc3b6583d2ea309f850", name: "Teacher Education" } },
];

export function setAuthTokenForTools(token: string | undefined): void {
  currentAuthToken = token as string;
}

const resolveApiUrl = (docUrl: string, fallbackPath: string) => {
  const baseUrl = apiDocs.baseURL;
  if (docUrl && !docUrl.includes("undefined")) {
    return docUrl.replace(apiDocs.baseURL || baseUrl, baseUrl);
  }
  return `${baseUrl}${fallbackPath}`;
};

function resolveSubjectNameToId(subjectName: string): string | null {
  const normalized = subjectName.trim().toLowerCase();
  if (!normalized) return null;
  const match = SYLLABUS_SUBJECTS.find(
    (s) => s.name.trim().toLowerCase() === normalized
  );
  return match ? match._id : null;
}

function resolveLevelNameToIds(levelName: string): { levelId: string; educationLevelId: string } | null {
  const normalized = levelName.trim().toLowerCase();
  if (!normalized) return null;
  const match = SYLLABUS_LEVELS.find(
    (l) => l.name.trim().toLowerCase() === normalized
  );
  if (!match) return null;
  return { levelId: match._id, educationLevelId: match.educationLevel._id };
}

async function fetchSyllabusFromApi(
  subjectId: string,
  levelId: string,
  educationLevelId: string
): Promise<any | null> {
  const url = `${apiDocs.syllabus.getSyllabus}?subject=${encodeURIComponent(subjectId)}&level=${encodeURIComponent(levelId)}&educationLevel=${encodeURIComponent(educationLevelId)}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (currentAuthToken?.trim()) {
    headers.Authorization = `Bearer ${currentAuthToken.trim()}`;
  }
  try {
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatSyllabusForAgent(syllabus: Syllabus): string {
  let formatted = `SYLLABUS: ${syllabus.syllabus_title}\n`;
  formatted += `LEVEL: ${syllabus.level}\n\n`;
  formatted += `TOTAL COMPETENCES: ${syllabus.content.length}\n\n`;
  formatted += "=".repeat(80) + "\n\n";
  syllabus.content.forEach((competence, index) => {
    formatted += `COMPETENCE ${index + 1}:\n`;
    formatted += `Main Competence: ${competence.main_competence}\n`;
    formatted += `Specific Competence: ${competence.specific_competence}\n`;
    formatted += `Number of Periods: ${competence.number_of_periods}\n\n`;
    formatted += "Learning Activities:\n";
    competence.learning_activities.forEach((activity, actIndex) => {
      formatted += `  ${actIndex + 1}. ${activity.activity}\n`;
      formatted += `     Teaching Methods:\n`;
      activity.teaching_learning_methods.forEach((method) => {
        formatted += `       - ${method}\n`;
      });
      formatted += `     Assessment: ${activity.assessment_criteria}\n`;
      formatted += `     Resources: ${activity.suggested_resources}\n\n`;
    });
    formatted += "-".repeat(80) + "\n\n";
  });
  return formatted;
}

function parseSyllabusResponse(rawData: any): {
  syllabus: string;
  competences: any[];
  chapters: any[];
  found: boolean;
} {
  if (!rawData || typeof rawData !== "object") {
    return { syllabus: "", competences: [], chapters: [], found: false };
  }
  const competences: any[] = [];
  const chapters: any[] = [];

  if (rawData.syllabus_metadata && rawData.competences && rawData.chapters) {
    const meta = rawData.syllabus_metadata;
    const title = meta.title || "Syllabus";
    const level = meta.level || "";
    let syllabus = `SYLLABUS: ${title}\nLEVEL: ${level}\n`;
    if (meta.total_periods) syllabus += `TOTAL PERIODS: ${meta.total_periods}\n`;
    syllabus += "\n" + "=".repeat(80) + "\n\nCHAPTERS (Book Structure):\n";
    const rawChapters = Array.isArray(rawData.chapters) ? rawData.chapters : [];
    rawChapters.forEach((ch: any) => {
      syllabus += `  Chapter ${ch.chapter_number ?? ""}: ${ch.title ?? ""}\n`;
      if (Array.isArray(ch.sections)) {
        ch.sections.slice(0, 3).forEach((sec: any) => {
          syllabus += `    - ${sec.title ?? ""}\n`;
        });
        if (ch.sections.length > 3) {
          syllabus += `    ... and ${ch.sections.length - 3} more sections\n`;
        }
      }
      chapters.push({
        chapter_number: ch.chapter_number,
        title: ch.title ?? "",
        sections: (ch.sections || []).map((s: any) => s.title),
      });
    });
    syllabus += "\n" + "=".repeat(80) + "\n\nCOMPETENCES (Curriculum Requirements):\n\n";
    (rawData.competences || []).forEach((c: any, index: number) => {
      syllabus += `COMPETENCE ${index + 1}:\n  Main: ${c.main_competence ?? ""}\n  Specific: ${c.specific_competence ?? ""}\n  Periods: ${c.number_of_periods ?? ""}\n\n  Learning Activities:\n`;
      (c.learning_activities || []).forEach((a: any, actIdx: number) => {
        syllabus += `    ${actIdx + 1}. ${a.activity ?? ""}\n`;
        syllabus += `       Related Chapters: ${(a.related_chapters || []).join(", ") || "N/A"}\n`;
        (a.teaching_learning_methods || []).forEach((method: string) => {
          syllabus += `         • ${method}\n`;
        });
        syllabus += `       Assessment: ${a.assessment_criteria ?? ""}\n       Resources: ${a.suggested_resources ?? ""}\n\n`;
      });
      syllabus += "-".repeat(80) + "\n\n";
      competences.push({
        main_competence: c.main_competence,
        specific_competence: c.specific_competence,
        periods: c.number_of_periods,
        learning_activities: (c.learning_activities || []).map((a: any) => ({
          activity: a.activity,
          related_chapters: a.related_chapters,
          teaching_methods: a.teaching_learning_methods,
          assessment_criteria: a.assessment_criteria,
          suggested_resources: a.suggested_resources,
        })),
      });
    });
    return { syllabus, competences, chapters, found: true };
  }

  if (rawData.syllabus_title && rawData.level && rawData.content) {
    const syllabus = formatSyllabusForAgent(rawData as Syllabus);
    const content = rawData.content || [];
    content.forEach((c: any) => {
      competences.push({
        main_competence: c.main_competence,
        specific_competence: c.specific_competence,
        periods: c.number_of_periods,
        activities_count: (c.learning_activities || []).length,
      });
    });
    return { syllabus, competences, chapters, found: true };
  }

  if ((rawData.book_metadata || rawData.book_info) && rawData.chapters) {
    const bookInfo = rawData.book_metadata || rawData.book_info;
    const title = bookInfo.title || "Syllabus";
    const level = bookInfo.level || "";
    let syllabus = `SYLLABUS: ${title}\nLEVEL: ${level}\n\nNOTE: This syllabus uses chapter-based structure only.\n\n`;
    const rawChapters = Array.isArray(rawData.chapters) ? rawData.chapters : [];
    syllabus += `TOTAL CHAPTERS: ${rawChapters.length}\n\n`;
    rawChapters.forEach((ch: any) => {
      syllabus += `CHAPTER ${ch.chapter_number ?? ""}: ${ch.title ?? ""}\n`;
      (ch.sections || []).forEach((sec: any, idx: number) => {
        syllabus += `  ${idx + 1}. ${sec.title ?? ""}\n`;
      });
      syllabus += "\n";
      chapters.push({
        chapter_number: ch.chapter_number,
        title: ch.title ?? "",
        sections: (ch.sections || []).map((s: any) => s.title),
      });
    });
    return { syllabus, competences, chapters, found: true };
  }

  return { syllabus: "", competences: [], chapters: [], found: false };
}

async function fetchSubjectsFromApi(): Promise<any[]> {
  const url = resolveApiUrl(apiDocs.subjects.getSubjects, "/subjects");
  const publicUrl = resolveApiUrl(
    apiDocs.subjects.getPublicSubjects,
    "/public-subjects",
  );
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (currentAuthToken?.trim()) {
    headers.Authorization = `Bearer ${currentAuthToken.trim()}`;
  }

  const extractList = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.subjects)) return data.subjects;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const response = await fetch(url, { headers });
  if (response.ok) {
    return extractList(await response.json());
  }

  if (
    (response.status === 401 || response.status === 403) &&
    !headers.Authorization
  ) {
    const publicResponse = await fetch(publicUrl, {
      headers: { "Content-Type": "application/json" },
    });
    if (publicResponse.ok) {
      return extractList(await publicResponse.json());
    }
  }

  throw new Error(
    `Subjects API error: ${response.status} ${response.statusText}`,
  );
}

export const studentTools = {
  getSyllabus: tool({
    description:
      "Fetch the syllabus (competences, chapters, learning activities) for a subject and level. Use when you need to know which chapters exist so you can map the user's question to the right chapter, then call getChapterFigures with that chapter name. Inputs are names only (e.g. biology, Form 2).",
    inputSchema: z.object({
      subject: z
        .string()
        .describe(
          "Subject name (e.g. physics, biology, chemistry, mathematics, geography, Horticulture Attendant, English). Use exact name.",
        ),
      level: z
        .string()
        .describe(
          "Level name (e.g. Form 1, Form 2, Form 3, Form 4, Form 5, Form 6). Use exact name.",
        ),
    }),
    execute: async ({ subject, level }) => {
      const subjectParam = subject?.trim() || "";
      const levelParam = level?.trim() || "";

      if (!subjectParam) {
        return {
          found: false,
          error: "Subject is required. Use one of: Physics, Chemistry, Biology, Geography, Mathematics, Horticulture Attendant, English.",
          syllabus: "",
          competences: [],
          chapters: [],
        };
      }
      if (!levelParam) {
        return {
          found: false,
          error: "Level is required. Use one of: Form 1, Form 2, Form 3, Form 4, Form 5, Form 6, or the Diploma levels.",
          syllabus: "",
          competences: [],
          chapters: [],
        };
      }

      const subjectId = resolveSubjectNameToId(subjectParam);
      if (!subjectId) {
        return {
          found: false,
          error: `Subject "${subjectParam}" not found. Use one of: Physics, Chemistry, Biology, Geography, Mathematics, Horticulture Attendant, English.`,
          syllabus: "",
          competences: [],
          chapters: [],
        };
      }

      const levelIds = resolveLevelNameToIds(levelParam);
      if (!levelIds) {
        return {
          found: false,
          error: `Level "${levelParam}" not found. Use one of: Form 1, Form 2, Form 3, Form 4, Form 5, Form 6.`,
          syllabus: "",
          competences: [],
          chapters: [],
        };
      }

      const cacheKey = `syllabus:${subjectId}:${levelIds.levelId}:${levelIds.educationLevelId}`;
      const cached = syllabusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < SYLLABUS_CACHE_TTL_MS) {
        return cached.value;
      }

      const rawData = await fetchSyllabusFromApi(
        subjectId,
        levelIds.levelId,
        levelIds.educationLevelId
      );
      if (!rawData) {
        return {
          found: false,
          error: `No syllabus returned for ${subjectParam} ${levelParam}. The backend may not have syllabus data for this subject and level.`,
          syllabus: "",
          competences: [],
          chapters: [],
        };
      }

      const { syllabus: syllabusText, competences, chapters, found } = parseSyllabusResponse(rawData);
      if (!found) {
        return {
          found: false,
          error: "Syllabus response could not be parsed. Unexpected format from backend.",
          syllabus: "",
          competences: [],
          chapters: [],
        };
      }

      const result = {
        found: true,
        syllabus: syllabusText,
        competences,
        chapters,
        instruction:
          "Use chapters for content order and topics; use competences (main_competence, specific_competence, learning_activities) for what the student must achieve. Teach one concept at a time using both: chapter content for the topic and the associated competence for the learning goal. Call getChapterFigures with the exact chapter name (e.g. from chapters[].title)—no 'Chapter One' or 'Chapter X:' prefix.",
      };

      syllabusCache.set(cacheKey, { timestamp: Date.now(), value: result });
      if (syllabusCache.size > 50) {
        const firstKey = syllabusCache.keys().next().value;
        if (firstKey) syllabusCache.delete(firstKey);
      }

      return result;
    },
  }),

  getChapterFigures: tool({
    description:
      "Get image figures for a chapter/topic. Call whenever you are teaching—do NOT wait for the student to ask for visual aids. ALWAYS pass subject (e.g. physics, biology, chemistry) so figures match the conversation; never show biology images in a chemistry answer. Returns figures filtered by subject, topic, and chapter. When found: true, include at least one [image:shortcode] and never say 'no visual aids'.",
    inputSchema: z.object({
      chapter: z
        .string()
        .describe(
          "Exact chapter name from getSyllabus (e.g. 'Concept of Physics', 'Magnetism', 'Refraction and dispersion of light'). Maps to figures topic. Do NOT use 'Chapter One' or 'Chapter X:' prefix.",
        ),
      topic: z
        .string()
        .optional()
        .describe("EXACT topic name from the user's message or context."),
      subject: z
        .string()
        .optional()
        .describe("Subject name to filter figures (e.g. physics, biology, chemistry). Always pass when the conversation is about a specific subject so images match—e.g. biology question → only biology images."),
    }),
    execute: async ({ chapter, topic, subject }) => {
      try {
        let querySubject = subject?.toLowerCase().trim() || null;
        if (!querySubject) {
          try {
            const subjects = await fetchSubjectsFromApi();
            const chapterLower = chapter.toLowerCase();
            const subjectNames = subjects
              .map(
                (item: any) =>
                  item?.name ||
                  item?.title ||
                  item?.subject ||
                  item?.subject_name ||
                  "",
              )
              .map((name: string) => name.toLowerCase().trim())
              .filter((name: string) => name.length > 0);

            querySubject =
              subjectNames.find((name: string) =>
                chapterLower.includes(name),
              ) || null;
          } catch {
            querySubject = null;
          }
        }

        // Check if authentication token is available
        if (!currentAuthToken || !currentAuthToken.trim()) {
          return {
            found: false,
            error:
              "Authentication required. User must be signed in to access figures.",
            figures: [],
            requiresAuth: true,
          };
        }

        let images: any[] = [];
        try {
          const { getFigures } = await import("../../utils/figuresApi");

          const filterOptions: { category?: string } = {};
          if (querySubject) {
            filterOptions.category = querySubject;
          }

          let figures = await getFigures(filterOptions, currentAuthToken);

          if (figures.length === 0 && querySubject) {
            figures = await getFigures({}, currentAuthToken);
          }

          images = figures.map((fig: any) => ({
            figure_number: fig.figure_number || "",
            caption: fig.alt || "",
            description: fig.description || "",
            shortcode: fig.shortcode || "",
            page_number: fig.page_number || null,
            chapter: fig.chapterName || "",
            topic: fig.topicName || "",
            subject: fig.subjectName || "",
            path: fig.path || "",
            paths: fig.paths || [],
            category: fig.category || "",
          }));
        } catch (error: any) {
          // Check if it's an authentication error
          const errorMessage = error.message || String(error);
          if (
            errorMessage.includes("401") ||
            errorMessage.includes("authentication") ||
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("No user authentication token")
          ) {
            return {
              found: false,
              error: "Authentication failed. Please sign in to access figures.",
              figures: [],
              requiresAuth: true,
            };
          }

          return {
            found: false,
            error: `Figure metadata not available: ${errorMessage}`,
            figures: [],
          };
        }

        if (images.length === 0) {
          return {
            found: false,
            message:
              "No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.",
            figures: [],
          };
        }

        // Syllabus chapter maps to figures topic (Option 1). Filter by topic only.
        const normalize = (s: string) =>
          (s || "").toLowerCase().trim().replace(/\s+/g, " ");

        const syllabusChapter = normalize(chapter);

        const matchesTopicAgainst = (img: any, against: string) => {
          const normalizedAgainst = normalize(against || "");
          if (!normalizedAgainst) return false;
          const imgTopic = normalize(img.topic || "");
          const imgChapter = normalize(img.chapter || "");
          const check = (field: string) =>
            field === normalizedAgainst ||
            field.includes(normalizedAgainst) ||
            normalizedAgainst.includes(field);
          return check(imgTopic) || check(imgChapter);
        };

        const applySubjectFilter = (imgs: any[]) => {
          if (!querySubject) return imgs;
          return imgs.filter((img: any) => {
            const imgSubject = (img.subject || img.category || "").toLowerCase();
            const imgShortcode = (img.shortcode || "").toLowerCase();
            return (
              imgSubject === querySubject || imgShortcode.startsWith(querySubject)
            );
          });
        };

        // Step 1: Try topic param vs img.topic first (if topic provided)
        let filtered: any[] = [];
        if (topic && topic.trim() && topic.trim().toLowerCase() !== "all") {
          filtered = images.filter((img: any) => matchesTopicAgainst(img, topic));
          filtered = applySubjectFilter(filtered);
        }

        // Step 2: If no match, try chapter vs img.topic
        if (filtered.length === 0) {
          filtered = images.filter((img: any) => matchesTopicAgainst(img, chapter));
          filtered = applySubjectFilter(filtered);
        }

        // Step 3: Only return figures that have at least one URL so the frontend can resolve [image:shortcode]
        filtered = filtered.filter(
          (img: any) =>
            (img.path && String(img.path).trim() !== "") ||
            (Array.isArray(img.paths) && img.paths.length > 0)
        );
        let figures = filtered.map((img: any) => ({
          figure_number: img.figure_number || "",
          caption: img.caption || "",
          description: img.description || "",
          shortcode: img.shortcode || "",
          page_number: img.page_number || null,
          chapter: img.chapter || "",
          topic: img.topic || "",
        }));

        const usedShortcodes = getUsedFigureShortcodes();
        if (usedShortcodes.size > 0) {
          const before = figures.length;
          figures = figures.filter((f: any) => !usedShortcodes.has(String(f.shortcode || "").trim()));
          if (figures.length === 0) {
            return {
              found: false,
              message:
                "All figures for this chapter have already been shown in this conversation. Teach using text only—do NOT repeat an image. Do not mention images or visual aids.",
              figures: [],
            };
          }
        }


        if (figures.length === 0) {
          return {
            found: false,
            message: `No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.`,
            figures: [],
          };
        }

        // Small sample for illustration only (do not list hundreds)
        const exampleShortcodes = figures.slice(0, 5).map((f: any) => `[image:${f.shortcode}]`);
        const exampleText = exampleShortcodes.length > 0 ? ` e.g. ${exampleShortcodes.join(", ")}` : "";


        return {
          found: true,
          total: figures.length,
          chapter: chapter,
          topic: topic || null,
          figures: figures,
          usage: `You have figures available. Use ONLY shortcodes from the "figures" array in this tool result—each figure has a "shortcode" field. Write [image:<that exact shortcode>]. Do NOT invent or reuse shortcodes from other turns; only use shortcodes from this response. Do NOT use markdown image syntax ![caption](...). Include at least one figure in your response.${exampleText}`,
          instruction: `MANDATORY: Include at least one image. Use only shortcodes from the figures array in this result (shortcode field). Format: [image:<exact shortcode>]. Do not use any shortcode not in this response.`,
        };
      } catch (error: any) {
        return {
          found: false,
          error: error.message || "Unknown error occurred",
          figures: [],
        };
      }
    },
  }),

  getSubjects: tool({
    description:
      "Get the current list of available subjects from the API. Use this when you need to know which subjects exist or to validate a subject name.",
    inputSchema: z.object({
      includeLevels: z
        .boolean()
        .optional()
        .describe("Include level information if available."),
    }),
    execute: async ({ includeLevels }) => {
      try {
        const subjects = await fetchSubjectsFromApi();
        const normalized = subjects
          .map((subject: any) => ({
            id:
              subject?._id ||
              subject?.id ||
              subject?.subjectId ||
              subject?.uuid ||
              null,
            name:
              subject?.name ||
              subject?.title ||
              subject?.subject ||
              subject?.subject_name ||
              "",
            level:
              subject?.level ||
              subject?.classLevel ||
              subject?.educationLevel ||
              subject?.levelName ||
              null,
            description:
              subject?.description ||
              subject?.summary ||
              subject?.about ||
              null,
          }))
          .filter((subject: any) => subject.name);

        const subjectList = normalized.map((subject: any) =>
          includeLevels
            ? {
                id: subject.id,
                name: subject.name,
                level: subject.level,
                description: subject.description,
              }
            : {
                id: subject.id,
                name: subject.name,
                description: subject.description,
              },
        );

        return {
          found: subjectList.length > 0,
          total: subjectList.length,
          subjects: subjectList,
          instruction:
            "Use this list to reference valid subjects. If the user's subject is not listed, ask them to choose from the available subjects.",
        };
      } catch (error: any) {
        return {
          found: false,
          subjects: [],
          error: error?.message || "Failed to load subjects",
        };
      }
    },
  }),

  // getSubjectTopics removed: topic endpoint coverage is limited; rely on RAG + model knowledge instead.

  solveMath: tool({
    description: `Do symbolic or numeric math with a CAS — safe replacement for any manual calculation. ALWAYS use this before stating a non-trivial algebraic result so your shown work is correct.

**MANDATORY RENDERING:** after calling this tool, you MUST embed the returned \`steps\` in a fenced \`\`\`steps block in your reply — do NOT retype the steps as markdown prose. Format:
\`\`\`steps
{"title":"<short title>","steps":<the steps array from the tool result>,"finalLatex":"<the latex field from the tool result>"}
\`\`\`
Do this for differentiate, solve, simplify, factor, expand, and evaluate — any time the tool returned steps. The frontend renders this as an interactive step block.


Operations:
- "evaluate": compute a numeric value (e.g. 2+3*sin(pi/4)).
- "simplify": algebraically simplify an expression (e.g. (x^2-1)/(x-1) → x+1).
- "expand": expand products/powers (e.g. (x+1)^2 → x^2+2x+1). Implemented via simplify rules.
- "factor": factor a polynomial where possible (via rationalize + simplify).
- "differentiate": derivative w.r.t. variable (default x). Supports higher order via 'order'.
- "solve": solve a linear or simple polynomial equation in one variable for its roots. For systems, send one equation per call is not supported — keep to single-variable.

Always pass the raw math expression (no $ or \\( delimiters). Use '*' for multiplication, '^' for power. The tool returns { result, latex, steps[] } where steps has { description, expression, latex } — prefer to render the steps to the student as a ${''}\`\`\`steps ... \`\`\` fenced block.`,
    inputSchema: z.object({
      operation: z.enum([
        "evaluate",
        "simplify",
        "expand",
        "factor",
        "differentiate",
        "solve",
      ]),
      expression: z.string().describe("Math expression, e.g. 'x^2 + 2*x + 1' or '2+3*4'. For 'solve', an equation like 'x^2 - 5*x + 6 = 0'."),
      variable: z.string().optional().describe("Variable for differentiate/solve. Default: 'x'."),
      order: z.number().int().min(1).max(5).optional().describe("Derivative order (default 1)."),
    }),
    execute: async ({ operation, expression, variable, order }) => {
      const v = (variable || "x").trim() || "x";
      const steps: Array<{ description: string; expression: string; latex: string }> = [];
      const toLatex = (node: any): string => {
        try {
          return typeof node?.toTex === "function" ? node.toTex({ parenthesis: "auto", implicit: "hide" }) : String(node);
        } catch {
          return String(node);
        }
      };
      try {
        if (operation === "evaluate") {
          const parsed = mathParse(expression);
          steps.push({ description: "Expression", expression, latex: toLatex(parsed) });
          const value = mathEvaluate(expression);
          const resultStr = typeof value === "number" ? String(value) : String(value);
          steps.push({ description: "Numeric value", expression: resultStr, latex: resultStr });
          return { ok: true, operation, input: expression, result: resultStr, latex: toLatex(parsed) + " = " + resultStr, steps, renderInstruction: "Embed these steps as a ```steps fenced block in your reply. Do not retype them in prose." };
        }
        if (operation === "simplify" || operation === "expand" || operation === "factor") {
          const parsed = mathParse(expression);
          steps.push({ description: "Input", expression, latex: toLatex(parsed) });
          // First pass: rationalize (reduces rational expressions like (x^2-1)/(x-1) → x+1)
          let working: any = parsed;
          try {
            const rat = mathRationalize(parsed, {}, true) as any;
            const candidate = rat?.expression ?? rat;
            if (candidate && String(candidate) !== String(parsed)) {
              working = candidate;
              steps.push({ description: "Rationalized", expression: String(working), latex: toLatex(working) });
            }
          } catch { /* rationalize can fail on non-rational exprs */ }
          const final = mathSimplify(working);
          const label = operation === "expand" ? "Expanded" : operation === "factor" ? "Factored/simplified" : "Simplified";
          steps.push({ description: label, expression: String(final), latex: toLatex(final) });
          return { ok: true, operation, input: expression, result: String(final), latex: toLatex(final), steps, renderInstruction: "Embed these steps as a ```steps fenced block in your reply. Do not retype them in prose." };
        }
        if (operation === "differentiate") {
          const parsed = mathParse(expression);
          steps.push({ description: `f(${v}) =`, expression, latex: toLatex(parsed) });
          let current: any = parsed;
          const n = order ?? 1;
          for (let i = 0; i < n; i++) {
            current = mathDerivative(current, v);
            const simp = mathSimplify(current);
            current = simp;
            steps.push({ description: `Derivative (order ${i + 1})`, expression: String(simp), latex: toLatex(simp) });
          }
          return { ok: true, operation, input: expression, result: String(current), latex: toLatex(current), steps, renderInstruction: "Embed these steps as a ```steps fenced block. Example: \\n```steps\\n{\"title\":\"Differentiation\",\"steps\":[...returned steps...],\"finalLatex\":\"...the latex field...\"}\\n```" };
        }
        if (operation === "solve") {
          // Accept "lhs = rhs" or a single expression (treated as = 0)
          const parts = expression.split("=");
          const lhsRaw = parts[0] ?? "0";
          const rhsRaw = parts.length > 1 ? parts.slice(1).join("=") : "0";
          const normalized = `(${lhsRaw}) - (${rhsRaw})`;
          const parsed = mathParse(normalized);
          steps.push({ description: "Move all terms to one side", expression: `${normalized} = 0`, latex: toLatex(parsed) + " = 0" });
          const simp = mathSimplify(parsed);
          steps.push({ description: "Simplified", expression: String(simp) + " = 0", latex: toLatex(simp) + " = 0" });
          // Try to coerce to polynomial coefficients in variable v
          let coeffs: number[] | null = null;
          try {
            const rat = mathRationalize(simp, {}, true) as any;
            const poly = rat?.expression ?? rat;
            // Collect coefficients by evaluating at integer points (Lagrange-like) — safe for low degree.
            // Degree detection: try up to 4
            const maxDeg = 4;
            const points: Array<{ x: number; y: number }> = [];
            for (let x = 0; x <= maxDeg; x++) {
              const scope: any = {}; scope[v] = x;
              const y = mathEvaluate(String(poly), scope);
              if (typeof y !== "number" || !isFinite(y)) { coeffs = null; break; }
              points.push({ x, y });
            }
            if (points.length === maxDeg + 1) {
              // Fit via finite differences to find lowest degree
              // Build Vandermonde and solve (gaussian elimination)
              const A: number[][] = points.map(p => Array.from({ length: maxDeg + 1 }, (_, i) => p.x ** i));
              const b = points.map(p => p.y);
              // Gauss-Jordan
              const N = maxDeg + 1;
              for (let i = 0; i < N; i++) {
                let pivot = i;
                for (let k = i + 1; k < N; k++) if (Math.abs(A[k]![i]!) > Math.abs(A[pivot]![i]!)) pivot = k;
                [A[i], A[pivot]] = [A[pivot]!, A[i]!];
                [b[i], b[pivot]] = [b[pivot]!, b[i]!];
                const div = A[i]![i]!;
                if (Math.abs(div) < 1e-12) continue;
                for (let j = i; j < N; j++) A[i]![j]! /= div;
                b[i]! /= div;
                for (let k = 0; k < N; k++) {
                  if (k === i) continue;
                  const factor = A[k]![i]!;
                  for (let j = i; j < N; j++) A[k]![j]! -= factor * A[i]![j]!;
                  b[k]! -= factor * b[i]!;
                }
              }
              coeffs = b.map(x => Math.abs(x) < 1e-10 ? 0 : x);
              while (coeffs.length > 1 && Math.abs(coeffs[coeffs.length - 1]!) < 1e-10) coeffs.pop();
            }
          } catch { coeffs = null; }

          const roots: Array<{ real: number; imag?: number } | string> = [];
          if (coeffs && coeffs.length <= 3) {
            if (coeffs.length === 2) {
              // a + b*x = 0
              const a = coeffs[0]!, b = coeffs[1]!;
              if (Math.abs(b) < 1e-12) {
                steps.push({ description: "No solution (0 = constant)", expression: "", latex: "\\text{no solution}" });
              } else {
                const r = -a / b;
                roots.push({ real: r });
                steps.push({ description: `Linear: ${v} = -a/b`, expression: `${v} = ${r}`, latex: `${v} = ${r}` });
              }
            } else if (coeffs.length === 3) {
              const c = coeffs[0]!, b = coeffs[1]!, a = coeffs[2]!;
              const disc = b * b - 4 * a * c;
              steps.push({ description: "Quadratic discriminant Δ = b² − 4ac", expression: `Δ = ${disc}`, latex: `\\Delta = ${disc}` });
              if (disc >= 0) {
                const s = Math.sqrt(disc);
                const r1 = (-b + s) / (2 * a);
                const r2 = (-b - s) / (2 * a);
                roots.push({ real: r1 }, { real: r2 });
                steps.push({ description: "Roots via quadratic formula", expression: `${v} = ${r1}, ${r2}`, latex: `${v} = ${r1},\\ ${r2}` });
              } else {
                const s = Math.sqrt(-disc);
                const re = -b / (2 * a), im = s / (2 * a);
                roots.push({ real: re, imag: im }, { real: re, imag: -im });
                steps.push({ description: "Complex roots", expression: `${v} = ${re} ± ${im}i`, latex: `${v} = ${re} \\pm ${im}i` });
              }
            }
          } else {
            steps.push({ description: "Equation is not a supported polynomial (degree ≤ 2) — returning simplified form for inspection.", expression: String(simp) + " = 0", latex: toLatex(simp) + " = 0" });
          }

          const resultStr = roots.length
            ? roots.map(r => typeof r === "string" ? r : (r.imag ? `${r.real}${r.imag >= 0 ? "+" : ""}${r.imag}i` : String(r.real))).join(", ")
            : String(simp) + " = 0";

          return { ok: true, operation, input: expression, variable: v, result: resultStr, roots, latex: resultStr, steps, renderInstruction: "Embed these steps as a ```steps fenced block in your reply." };
        }
      } catch (err: any) {
        return { ok: false, operation, input: expression, error: err?.message || String(err), steps };
      }
      return { ok: false, operation, input: expression, error: "Unsupported operation" };
    },
    // NOTE: wrapping the successful return is done inline above; frontend expects a ```steps block.
  }),

  plotFunction: tool({
    description: `Produce a 2D plot of one or more functions of x. Use whenever a graph helps the student (parabolas, trig, linear, exponential, intersections). The tool returns a JSON spec; YOU MUST then emit a fenced block exactly like:

\`\`\`graph
{"expressions":["x^2","2*x+1"],"xRange":[-5,5],"title":"Parabola and line","annotations":[{"x":2,"y":4,"label":"(2,4)"}]}
\`\`\`

Rules: use '*' for multiplication and '^' for power; no LaTeX inside expressions; each expression is the right-hand side only (write "x-1", NOT "y=x-1" or "f(x)=x-1"). Keep xRange reasonable (usually 5–20 wide). The frontend renders the plot with function-plot.`,
    inputSchema: z.object({
      expressions: z.array(z.string()).min(1).max(4).describe("Functions of x, e.g. ['x^2', '2*x+1']."),
      xRange: z.array(z.number()).min(2).max(2).describe("[xMin, xMax] — two numbers"),
      yRange: z.array(z.number()).min(2).max(2).optional().describe("[yMin, yMax] — two numbers (optional)"),
      title: z.string().optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
      annotations: z
        .array(z.object({ x: z.number(), y: z.number(), label: z.string().optional() }))
        .optional(),
    }),
    execute: async (spec) => {
      // Strip common LHS prefixes the model sometimes produces: "y=...", "f(x)=...", "g(x)=...", "y ="
      spec.expressions = spec.expressions.map((e) =>
        e.replace(/^\s*(?:y|[a-z]\s*\(\s*x\s*\))\s*=\s*/i, "").trim()
      );
      const invalid: string[] = [];
      for (const expr of spec.expressions) {
        if (expr.includes("=")) { invalid.push(expr); continue; }
        try { mathParse(expr); } catch { invalid.push(expr); }
      }
      if (invalid.length) {
        return { ok: false, error: `Invalid expressions: ${invalid.join(", ")}. Use '*' for multiplication and '^' for power, right-hand side only (no 'y=' or '='). No LaTeX.` };
      }
      return {
        ok: true,
        spec,
        instruction:
          "Now include the plot in your reply as a ```graph fenced block with this JSON on one line: " +
          JSON.stringify(spec) +
          ". Then continue teaching with a competence-check question.",
      };
    },
  }),

  plotDataset: tool({
    description: `Produce a dataset chart (bar, line, pie, or scatter). Use for statistics, comparisons, populations, frequencies, trends. Returns a JSON spec that you MUST embed as:

\`\`\`chart
{"chartType":"bar","labels":["Jan","Feb","Mar"],"datasets":[{"label":"Rainfall (mm)","data":[120,80,150]}],"title":"Dar rainfall"}
\`\`\``,
    inputSchema: z.object({
      chartType: z.enum(["bar", "line", "pie", "scatter"]),
      labels: z.array(z.string()).optional(),
      datasets: z.array(
        z.object({
          label: z.string().optional(),
          data: z.array(z.union([z.number(), z.object({ x: z.number(), y: z.number() })])),
        })
      ).min(1),
      title: z.string().optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
    execute: async (spec) => ({
      ok: true,
      spec,
      instruction: "Embed the chart in your reply as a ```chart fenced block: " + JSON.stringify(spec),
    }),
  }),

  drawGeometry: tool({
    description: `Draw a labeled geometric figure (triangles, circles, lines, angles, points). Use for geometry chapters — triangles, Pythagoras, circles, angles. Returns a spec you MUST embed as:

\`\`\`geometry
{"width":320,"height":240,"shapes":[{"type":"triangle","points":[[40,200],[40,40],[280,200]],"labels":["A","B","C"],"sides":["3","4","5"],"rightAngleAt":0}]}
\`\`\`

Coordinates are in SVG pixel space (origin top-left). Keep within the declared width/height.`,
    inputSchema: z.object({
      width: z.number().default(320),
      height: z.number().default(240),
      title: z.string().optional(),
      shapes: z.array(
        z.object({
          type: z.enum(["triangle", "circle", "line", "point", "polygon", "angle", "rect"]),
          points: z.array(z.array(z.number()).min(2).max(2)).optional().describe("Array of [x,y] pairs"),
          center: z.array(z.number()).min(2).max(2).optional().describe("[cx, cy]"),
          radius: z.number().optional(),
          labels: z.array(z.string()).optional(),
          sides: z.array(z.string()).optional(),
          angle: z.string().optional(),
          rightAngleAt: z.number().optional().describe("Index of vertex with a right-angle mark."),
          stroke: z.string().optional(),
          fill: z.string().optional(),
        })
      ).min(1),
    }),
    execute: async (spec) => ({
      ok: true,
      spec,
      instruction: "Embed the drawing in your reply as a ```geometry fenced block: " + JSON.stringify(spec),
    }),
  }),

  searchTextbooks: tool({
    description: `Search uploaded textbooks (external RAG) for factual information about a topic.

WHEN TO USE THIS TOOL:
- When a student asks a FACTUAL question about curriculum content (e.g., "What is photosynthesis?", "Explain Newton's laws")
- When you need ACCURATE information from official textbooks

WHEN NOT TO USE THIS TOOL:
- For getting images (use getChapterFigures instead)
- For listing subjects (use getSubjects instead)

IMPORTANT: If this tool returns results, you MUST mention the book title (e.g. "According to [Book Title]..."). Do NOT mention chapter numbers or page numbers.`,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The search query - be specific and include the topic/concept you need information about.",
        ),
      subject: z.string().optional().describe("Optional: The subject area."),
      level: z.string().optional().describe("Optional: The education level."),
    }),
    execute: async ({ query, subject, level }) => {
      if (!query?.trim()) {
        return {
          found: false,
          message: "No search query provided",
          context: "",
        };
      }

      try {
        const config = useRuntimeConfig();
        const ragApiBaseUrl = config.ragApiBaseUrl || "http://opschool.tie.go.tz:5002";
        const insightsApiKey = config.insightsApiKey || "";

        const rawQuery = query.trim();

        // Call the advanced RAG search endpoint (POST /rag/query)
        const ragRequestBody: Record<string, any> = {
          query: rawQuery,
          topK: 5,
          useQueryExpansion: true,
          useMultiQuery: true,
          useHybrid: true,
          useReranking: false,
          returnParent: true,
        };

        // Note: subject/classLevel filters are NOT passed to the RAG API
        // because the tool receives text names (e.g. "physics") while the RAG
        // API expects database IDs. The query expansion and hybrid search
        // already find the right content without explicit filters.

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const ragResponse = await fetch(`${ragApiBaseUrl}/rag/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": insightsApiKey,
          },
          body: JSON.stringify(ragRequestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!ragResponse.ok) {
          const errorText = await ragResponse.text().catch(() => "");
          throw new Error(
            `RAG API error ${ragResponse.status}: ${errorText || ragResponse.statusText}`
          );
        }

        const ragData = await ragResponse.json();
        const results: any[] = ragData?.results || [];

        if (results.length === 0) {
          return {
            found: false,
            query: query,
            message: "No relevant textbook content found for this topic.",
            context: "",
            instruction:
              "Tell the student honestly: 'I don't have information about that topic in my textbooks yet. Please try rephrasing your question or asking about a different topic.' Do NOT answer from your own knowledge.",
          };
        }

        // Prioritize "content" chunks over "exercise" chunks, build context from parentContent
        const sorted = [...results].sort((a, b) => {
          if (a.chunkType === "content" && b.chunkType !== "content") return -1;
          if (a.chunkType !== "content" && b.chunkType === "content") return 1;
          return (b.score || 0) - (a.score || 0);
        });

        const contextParts: string[] = [];
        let totalChars = 0;
        const maxChars = 5000;

        for (const result of sorted) {
          // Use parentContent (richer context) when available, fall back to content
          const text = result.parentContent || result.content || "";
          if (!text.trim()) continue;

          const citation = result.citation || result.parentCitation || "Unknown source";
          const source = result.source || "";
          const score = result.score ? `Relevance: ${result.score.toFixed(2)}` : "";

          const header = [source, citation, score].filter(Boolean).join(" | ");
          const chunk = `[${header}]\n${text.trim()}`;

          if (totalChars + chunk.length > maxChars) break;
          contextParts.push(chunk);
          totalChars += chunk.length;
        }

        const context = contextParts.join("\n\n---\n\n");

        if (!context.trim()) {
          return {
            found: false,
            query: query,
            message: "No relevant textbook content found for this topic.",
            context: "",
            instruction:
              "Tell the student honestly: 'I don't have information about that topic in my textbooks yet. Please try rephrasing your question or asking about a different topic.' Do NOT answer from your own knowledge.",
          };
        }

        return {
          found: true,
          query: query,
          source: "rag-api",
          context: context,
          queriesUsed: ragData.queriesUsed || [rawQuery],
          methods: ragData.methods || [],
          instruction:
            "You MUST use the context above to answer. Mention the book title (e.g. 'According to [Book Title]...') but do NOT mention chapter numbers or page numbers. Do NOT use information outside this context.",
        };
      } catch (error: any) {
        // If RAG API fails, fall back to the old external RAG
        try {
          const queryContext =
            subject || level
              ? { subject: subject || undefined, level: level || undefined }
              : undefined;

          const ragResult = await fetchCombinedRAGContext(query.trim(), currentAuthToken, queryContext, {
            useLocal: false,
            useExternal: true,
            preferExternal: true,
          });

          if (ragResult.context && ragResult.context.trim().length > 0) {
            let context = ragResult.context;
            if (context.length > 3500) {
              context = context.slice(0, 3500).trimEnd() + "...";
            }
            return {
              found: true,
              query: query,
              source: ragResult.source,
              context: context,
              instruction:
                "You MUST use the context above to answer. Mention the book title (e.g. 'According to [Book Title]...') but do NOT mention chapter numbers or page numbers. Do NOT use information outside this context.",
            };
          }
        } catch {
          // Both failed
        }

        return {
          found: false,
          query: query,
          error: error?.message || "Search failed",
          message:
            "An error occurred while searching textbooks. Please try again.",
          context: "",
        };
      }
    },
  }),
};
