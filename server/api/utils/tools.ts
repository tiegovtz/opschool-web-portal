import { AsyncLocalStorage } from "node:async_hooks";
import { tool } from "ai";
import { z } from "zod";
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8a567c1a-9db1-48ce-b2fd-fa63fd340bb4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tools.ts:getChapterFigures:entry',message:'getChapterFigures called',data:{chapter:chapter||'',topic:topic||'',subject:subject||''},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
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

          // #region agent log
          const firstCategory = figures[0]?.category || figures[0]?.subjectName || '';
          fetch('http://127.0.0.1:7242/ingest/8a567c1a-9db1-48ce-b2fd-fa63fd340bb4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tools.ts:getChapterFigures:afterGetFigures',message:'Figures from API',data:{figuresCount:figures.length,querySubject,firstCategory},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
          // #endregion

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

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8a567c1a-9db1-48ce-b2fd-fa63fd340bb4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tools.ts:getChapterFigures:afterFilter',message:'After chapter/topic filter',data:{filteredCount:figures.length,imagesCount:images.length,firstShortcode:figures[0]?.shortcode||''},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion

        if (figures.length === 0) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8a567c1a-9db1-48ce-b2fd-fa63fd340bb4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tools.ts:getChapterFigures:returnNone',message:'Returning no figures',data:{found:false,imagesCount:images.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          return {
            found: false,
            message: `No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.`,
            figures: [],
          };
        }

        // Small sample for illustration only (do not list hundreds)
        const exampleShortcodes = figures.slice(0, 5).map((f: any) => `[image:${f.shortcode}]`);
        const exampleText = exampleShortcodes.length > 0 ? ` e.g. ${exampleShortcodes.join(", ")}` : "";

        // #region agent log
        const firstShortcode = figures[0]?.shortcode || '';
        const firstCategoryReturn = figures[0] ? (figures[0] as any).shortcode?.split("_")[0] || '' : '';
        fetch('http://127.0.0.1:7242/ingest/8a567c1a-9db1-48ce-b2fd-fa63fd340bb4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tools.ts:getChapterFigures:return',message:'Returning figures to model',data:{found:true,total:figures.length,firstShortcode,firstCategoryReturn},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion

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

  math: tool({
    description: "Evaluate basic math expressions",
    inputSchema: z.object({ expression: z.string() }),
    execute: async ({ expression }) => {
      try {
        const result = eval(expression);
        return { result };
      } catch {
        return { result: "Invalid expression" };
      }
    },
  }),

  searchTextbooks: tool({
    description: `Search uploaded textbooks (external RAG) for factual information about a topic.

WHEN TO USE THIS TOOL:
- When a student asks a FACTUAL question about curriculum content (e.g., "What is photosynthesis?", "Explain Newton's laws")
- When you need ACCURATE information from official textbooks

WHEN NOT TO USE THIS TOOL:
- For greetings (e.g., "Hello", "Hi", "How are you?")
- For questions about yourself (e.g., "Who are you?", "What can you do?")
- For general conversation or clarification questions
- For getting images (use getChapterFigures instead)
- For listing subjects (use getSubjects instead)

IMPORTANT: If this tool returns results, you MUST cite them using: "According to [Book Title] ([Citation])..."`,
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
          // Use content (child chunk) as primary — it's precise and right-sized
          // Fall back to parentContent only if content is empty, but truncate it
          let text = result.content || "";
          if (!text.trim() && result.parentContent) {
            text = result.parentContent.slice(0, 1500);
          }
          if (!text.trim()) continue;

          const citation = result.citation || result.parentCitation || "Unknown source";
          const parentCitation = result.parentCitation || "";
          const source = result.source || "";

          const headerParts = [source];
          if (parentCitation) headerParts.push(parentCitation);
          headerParts.push(citation);
          const header = headerParts.filter(Boolean).join(" | ");
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
            "You MUST use the context above to answer. ALWAYS cite the source using format: 'According to [Book Title], [Chapter] ([Page])...'. Do NOT use information outside this context.",
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
                "You MUST use the context above to answer. ALWAYS cite the source using format: 'According to [Book Title] ([Citation])...'. Do NOT use information outside this context.",
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
