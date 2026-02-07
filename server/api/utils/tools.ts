import { tool } from "ai";
import { z } from "zod";
import { fetchCombinedRAGContext } from "../../utils/rag";
import apiDocs from "~/utilities/apiDocs";

let currentAuthToken: string | undefined = undefined;

const PUBLIC_TOPICS_TIMEOUT_MS = parseInt(
  process.env.PUBLIC_TOPICS_TIMEOUT_MS || "2500",
  10,
);
const PUBLIC_TOPICS_RETRY_TIMEOUT_MS = parseInt(
  process.env.PUBLIC_TOPICS_RETRY_TIMEOUT_MS || "4000",
  10,
);
const PUBLIC_TOPICS_CACHE_TTL_MS = parseInt(
  process.env.PUBLIC_TOPICS_CACHE_TTL_MS || "300000",
  10,
);

const publicTopicsCache = new Map<
  string,
  { timestamp: number; value: any[] }
>();

const SYLLABUS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const syllabusCache = new Map<
  string,
  { timestamp: number; value: any }
>();

const SUBJECT_ID_FALLBACK: Record<string, string> = {
  physics: "665865487b076d51f6fc037a",
  chemistry: "665865867b076d51f6fc037f",
  biology: "6658658d7b076d51f6fc0381",
  geography: "665865967b076d51f6fc0383",
  mathematics: "67f50a3fb88b1b7c13b40b40",
  "horticulture attendant": "695f54ae50ae29af5c1968d8",
  english: "696e182925b5df0cc3330d19",
};

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

const normalizeSyllabusName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildPublicTopicsCacheKey = (params: {
  name?: string;
  level?: string;
  subject?: string;
}) => {
  const tokenKey = currentAuthToken?.trim() || "anon";
  return [
    tokenKey,
    params.name || "",
    params.level || "",
    params.subject || "",
  ]
    .map((value) => value.toLowerCase())
    .join("|");
};

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
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

async function fetchPublicTopicsFromApi(params: {
  name?: string;
  level?: string;
  subject?: string;
}): Promise<any[]> {
  const url = resolveApiUrl(apiDocs.topics.filterTopics, "/public-topics");
  const query = new URLSearchParams();

  if (params.name?.trim()) query.append("name", params.name.trim());
  if (params.level?.trim()) query.append("level", params.level.trim());
  if (params.subject?.trim()) query.append("subject", params.subject.trim());

  const finalUrl = query.toString() ? `${url}?${query}` : url;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (currentAuthToken?.trim()) {
    headers.Authorization = `Bearer ${currentAuthToken.trim()}`;
  }

  const extractList = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.topics)) return data.topics;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const cacheKey = buildPublicTopicsCacheKey(params);
  const cached = publicTopicsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PUBLIC_TOPICS_CACHE_TTL_MS) {
    return cached.value;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(finalUrl, { headers }, PUBLIC_TOPICS_TIMEOUT_MS);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      response = await fetchWithTimeout(
        finalUrl,
        { headers },
        PUBLIC_TOPICS_RETRY_TIMEOUT_MS,
      );
    } else {
      throw error;
    }
  }
  if (!response.ok) {
    throw new Error(
      `Public topics API error: ${response.status} ${response.statusText}`,
    );
  }

  const value = extractList(await response.json());
  publicTopicsCache.set(cacheKey, { timestamp: Date.now(), value });
  return value;
}

export const studentTools = {
  checkSyllabus: tool({
    description:
      "Check the Tanzanian syllabus topics via the public-topics endpoint. Use this BEFORE answering a curriculum question to verify the topic is in-syllabus. Query params supported: name, level, subject. If no topics are found, this tool also checks textbook RAG to avoid false 'out of syllabus' for concepts that are in the books but not listed as topics.",
    inputSchema: z.object({
      name: z
        .string()
        .optional()
        .describe("Topic name or keyword to match against syllabus topics."),
      level: z
        .string()
        .optional()
        .describe("Education level to filter topics (e.g., Form 1, O-Level)."),
      subject: z
        .string()
        .optional()
        .describe("Subject name to filter topics (e.g., Biology, Physics)."),
    }),
    execute: async ({ name, level, subject }) => {
      const nameValue = name?.trim() || "";
      const normalizedName = nameValue ? normalizeSyllabusName(nameValue) : "";
      const levelValue = level?.trim() || "";
      const subjectValue = subject?.trim() || "";

      console.log("[checkSyllabus] Entry", {
        params: { name: nameValue || "(empty)", level: levelValue || "(empty)", subject: subjectValue || "(empty)" },
        normalizedName: normalizedName || "(none)",
      });

      if (!nameValue && !levelValue && !subjectValue) {
        console.log("[checkSyllabus] Early exit: no filter provided");
        return {
          found: false,
          total: 0,
          topics: [],
          message:
            "No syllabus filter provided. Provide at least a topic name, subject, or level.",
        };
      }

      try {
        let topics = await fetchPublicTopicsFromApi({
          name: nameValue || undefined,
          level: levelValue || undefined,
          subject: subjectValue || undefined,
        });

        console.log("[checkSyllabus] Initial API fetch", {
          topicsCount: topics.length,
          query: { name: nameValue || undefined, level: levelValue || undefined, subject: subjectValue || undefined },
        });

        let usedQuery = {
          name: nameValue || undefined,
          level: levelValue || undefined,
          subject: subjectValue || undefined,
        };

        if (topics.length === 0 && normalizedName && normalizedName !== nameValue) {
          console.log("[checkSyllabus] Retry with normalized name", { normalizedName });
          topics = await fetchPublicTopicsFromApi({
            name: normalizedName,
            level: levelValue || undefined,
            subject: subjectValue || undefined,
          });
          if (topics.length > 0) {
            usedQuery = {
              name: normalizedName,
              level: levelValue || undefined,
              subject: subjectValue || undefined,
            };
            console.log("[checkSyllabus] Normalized retry succeeded", { topicsCount: topics.length });
          }
        }

        // Fallback: if name-only yields no results, try treating name as subject
        if (topics.length === 0 && !subjectValue && nameValue) {
          console.log("[checkSyllabus] Fallback: treat name as subject", { nameValue });
          topics = await fetchPublicTopicsFromApi({
            subject: nameValue,
            level: levelValue || undefined,
          });
          if (topics.length > 0) {
            usedQuery = {
              name: undefined,
              level: levelValue || undefined,
              subject: nameValue,
            };
            console.log("[checkSyllabus] Subject fallback succeeded", { topicsCount: topics.length });
          }
        }

        const normalized = topics
          .map((topic: any) => ({
            id: topic?._id || topic?.id || topic?.topicId || null,
            name: topic?.name || topic?.title || topic?.topic || "",
            subject:
              topic?.subject?.name || topic?.subject || topic?.subjectName || null,
            level:
              topic?.level?.name || topic?.level || topic?.levelName || null,
            chapter:
              topic?.chapter?.name ||
              topic?.chapterName ||
              topic?.chapterTitle ||
              null,
          }))
          .filter((topic: any) => topic.name);

        const syllabusFound = normalized.length > 0;
        let ragFound = false;

        console.log("[checkSyllabus] Syllabus result", {
          syllabusFound,
          normalizedCount: normalized.length,
          usedQuery,
        });

        if (!syllabusFound) {
          const ragQuery =
            nameValue ||
            [subjectValue, levelValue].filter(Boolean).join(" ").trim();

          if (ragQuery) {
            const ragResult = await fetchCombinedRAGContext(
              ragQuery,
              currentAuthToken,
              {
                subject: subjectValue || undefined,
                level: levelValue || undefined,
              },
              {
                useLocal: false,
                useExternal: true,
                preferExternal: true,
              },
            );
            ragFound = Boolean(ragResult?.context?.trim());
            console.log("[checkSyllabus] RAG fallback", { ragFound, ragQuery });
          }
        }

        const finalFound = syllabusFound || ragFound;
        console.log("[checkSyllabus] Final result", {
          found: finalFound,
          syllabusFound,
          ragFound,
          topicsCount: normalized.length,
        });

        return {
          found: syllabusFound || ragFound,
          total: normalized.length,
          syllabusFound,
          ragFound,
          query: usedQuery,
          topics: normalized,
          instruction:
            syllabusFound
              ? "Topic is in syllabus. Proceed with normal teaching flow."
              : ragFound
                ? "Topic not listed in syllabus topics, but textbook context exists. Proceed with normal teaching flow and DO NOT say out of syllabus."
                : "Topic is OUT OF SYLLABUS. You MUST say: 'This is out of syllabus.' Then provide a brief meaning/definition in the same response, prefaced with 'If you still want the meaning:'.",
        };
      } catch (error: any) {
        console.error("[checkSyllabus] Error", {
          error: error?.message,
          stack: error?.stack,
        });
        return {
          found: false,
          total: 0,
          topics: [],
          error: error?.message || "Failed to load syllabus topics",
        };
      }
    },
  }),

  getSyllabus: tool({
    description:
      "Fetch the syllabus (topics and chapters) for a subject. Use this when you need to know which chapters exist for a subject so you can map the user's question to the right chapter, then call getChapterFigures with that chapter name. Returns topics with their chapters and level (e.g. Form 1, Form 2).",
    inputSchema: z.object({
      subject: z
        .string()
        .describe(
          "Subject name (e.g. physics, biology, chemistry) or subject ID. Use lowercase for names.",
        ),
    }),
    execute: async ({ subject }) => {
      const subjectParam = subject?.trim() || "";
      console.log("[getSyllabus] Entry", { subject: subjectParam || "(empty)" });

      if (!subjectParam) {
        console.log("[getSyllabus] Early exit: subject required");
        return {
          success: false,
          error: "Subject is required. Provide a subject name or ID.",
          subjectId: null,
          subjectName: null,
          topics: [],
        };
      }

      const cacheKey = `syllabus:${subjectParam.toLowerCase()}`;
      const cached = syllabusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < SYLLABUS_CACHE_TTL_MS) {
        console.log("[getSyllabus] Cache hit", { cacheKey, topicsCount: cached.value?.topics?.length ?? 0 });
        return cached.value;
      }
      console.log("[getSyllabus] Cache miss, fetching", { cacheKey });

      let subjectId: string | null = null;
      let subjectName: string | null = null;

      const resolveSubjectId = async (): Promise<string | null> => {
        const lower = subjectParam.toLowerCase().trim();
        if (/^[a-f0-9]{24}$/i.test(lower)) {
          return lower;
        }
        try {
          const subjects = await fetchSubjectsFromApi();
          const match = subjects.find(
            (s: any) =>
              (s?.name || s?.title || s?.subject || "")
                .toLowerCase()
                .trim() === lower,
          );
          if (match) {
            subjectName = match?.name || match?.title || match?.subject || subjectParam;
            return match?._id ?? match?.id ?? match?.subjectId ?? null;
          }
        } catch {
          // Fall through to fallback map
        }
        const fallbackId = SUBJECT_ID_FALLBACK[lower];
        if (fallbackId) {
          subjectName = subjectParam;
          return fallbackId;
        }
        return null;
      };

      subjectId = await resolveSubjectId();
      console.log("[getSyllabus] Subject resolution", {
        subjectParam,
        subjectId,
        subjectName: subjectName || "(none)",
      });

      if (!subjectId) {
        console.log("[getSyllabus] Subject not found", { subjectParam });
        return {
          success: false,
          error: `Subject "${subjectParam}" not found. Use getSubjects to see available subjects.`,
          subjectId: null,
          subjectName: null,
          topics: [],
        };
      }

      const topicsUrl = apiDocs.topics.getSubjectId.replace(
        "{subjectId}",
        subjectId,
      );
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentAuthToken?.trim()) {
        headers.Authorization = `Bearer ${currentAuthToken.trim()}`;
      }

      let topicsData: any;
      try {
        console.log("[getSyllabus] Fetching topics", { topicsUrl });
        const topicsRes = await fetch(topicsUrl, { method: "GET", headers });
        if (!topicsRes.ok) {
          console.error("[getSyllabus] Topics API error", {
            status: topicsRes.status,
            statusText: topicsRes.statusText,
          });
          return {
            success: false,
            error: `Topics API error: ${topicsRes.status} ${topicsRes.statusText}`,
            subjectId,
            subjectName: subjectName || subjectParam,
            topics: [],
          };
        }
        topicsData = await topicsRes.json();
        console.log("[getSyllabus] Topics fetched", {
          rawTopicsCount: Array.isArray(topicsData) ? topicsData.length : (topicsData?.topics?.length ?? topicsData?.data?.length ?? 0),
        });
      } catch (e: any) {
        console.error("[getSyllabus] Topics fetch error", { error: e?.message });
        return {
          success: false,
          error: e?.message || "Failed to fetch topics",
          subjectId,
          subjectName: subjectName || subjectParam,
          topics: [],
        };
      }

      const extractTopics = (data: any): any[] => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.topics)) return data.topics;
        if (Array.isArray(data?.data)) return data.data;
        return [];
      };

      const extractChapters = (data: any): any[] => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.chapters)) return data.chapters;
        if (Array.isArray(data?.data)) return data.data;
        return [];
      };

      const topics = extractTopics(topicsData);
      if (!subjectName && topics.length > 0) {
        const firstSubject = topics[0]?.subject;
        subjectName =
          firstSubject?.name || firstSubject?.title || firstSubject || subjectParam;
      }
      if (!subjectName) subjectName = subjectParam;

      const chaptersUrl = (topicId: string) =>
        apiDocs.chapters.getByTopicId.replace("{topicId}", topicId);

      const output: {
        subjectId: string;
        subjectName: string;
        topics: Array<{
          topicId: string;
          topicName: string;
          level: string | null;
          chapters: Array<{ id: string; name: string }>;
        }>;
      } = {
        subjectId,
        subjectName,
        topics: [],
      };

      console.log("[getSyllabus] Fetching chapters for topics", { topicsCount: topics.length });

      for (const topic of topics) {
        const topicId = topic._id ?? topic.id ?? "";
        const topicName = topic.name ?? topic.title ?? topicId;
        const level =
          topic.level?.name ?? topic.levelName ?? topic.level ?? null;

        const entry = {
          topicId,
          topicName,
          level,
          chapters: [] as Array<{ id: string; name: string }>,
        };

        const chRes = await fetch(chaptersUrl(topicId), {
          method: "GET",
          headers,
        });
        if (chRes.ok) {
          const chData = await chRes.json();
          const chapters = extractChapters(chData);
          console.log("[getSyllabus] Topic chapters", {
            topicName,
            topicId,
            chaptersCount: chapters.length,
          });
          entry.chapters = chapters.map((ch: any) => ({
            id: ch._id ?? ch.id ?? "",
            name: ch.name ?? ch.title ?? ch._id ?? ch.id ?? "",
          }));
        }

        output.topics.push(entry);
      }

      const result = {
        success: true,
        subjectId,
        subjectName,
        topics: output.topics,
        instruction:
          "Use these topics and chapters to map the user's question to the best-matching chapter. Call getChapterFigures with the exact chapter name (e.g. 'Concept of Physics', 'Measurement')—no 'Chapter One' or 'Chapter X:' prefix.",
      };

      syllabusCache.set(cacheKey, { timestamp: Date.now(), value: result });
      console.log("[getSyllabus] Success", {
        subjectId,
        subjectName,
        topicsCount: output.topics.length,
        totalChapters: output.topics.reduce((sum, t) => sum + t.chapters.length, 0),
      });
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
      console.log("[getChapterFigures] Entry", {
        chapter: chapter || "(empty)",
        topic: topic || "(empty)",
        subject: subject || "(empty)",
        hasToken: !!currentAuthToken,
      });
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
          } catch (e: any) {
            console.log("[getChapterFigures] Subject resolution from API failed", { error: e?.message });
            querySubject = null;
          }
        }
        console.log("[getChapterFigures] Subject for filter", {
          querySubject: querySubject || "(none)",
          source: subject ? "param" : "inferred",
        });

        // Check if authentication token is available
        if (!currentAuthToken || !currentAuthToken.trim()) {
          console.error(
            "[getChapterFigures] No authentication token available",
          );
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

          console.log("[getChapterFigures] Fetching by category only (Option B)", {
            category: filterOptions.category || "(none)",
            hasToken: !!currentAuthToken,
            chapterRequested: chapter,
            topicRequested: topic,
          });

          let figures = await getFigures(filterOptions, currentAuthToken);

          if (figures.length === 0 && querySubject) {
            console.log(
              "[getChapterFigures] No figures with category, trying all figures",
            );
            figures = await getFigures({}, currentAuthToken);
          }

          console.log("[getChapterFigures] Found figures:", figures.length);

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
          // Log the actual error for debugging
          console.error("[getChapterFigures] Error fetching figures:", {
            error: error.message,
            stack: error.stack,
            chapter,
            topic,
            subject: querySubject,
            hasToken: !!currentAuthToken,
          });

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
          console.log("[getChapterFigures] No images from API", { filterOptions });
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
          const imgTopic = normalize(img.topic || "");
          const normalizedAgainst = normalize(against || "");
          if (!normalizedAgainst) return false;
          return (
            imgTopic === normalizedAgainst ||
            imgTopic.includes(normalizedAgainst) ||
            normalizedAgainst.includes(imgTopic)
          );
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

        // Step 1: Try chapter vs img.topic
        console.log("[getChapterFigures] Filtering by topic (chapter → figures topic)", {
          imagesCount: images.length,
          syllabusChapter,
          querySubject,
        });
        let filtered = images.filter((img: any) => matchesTopicAgainst(img, chapter));
        filtered = applySubjectFilter(filtered);
        console.log("[getChapterFigures] After chapter filter", {
          filteredCount: filtered.length,
          imagesCount: images.length,
        });

        // Step 2: If no match and topic param provided, try topic vs img.topic
        if (filtered.length === 0 && topic && topic.trim() && topic.trim().toLowerCase() !== "all") {
          const syllabusTopic = normalize(topic);
          console.log("[getChapterFigures] Chapter match yielded 0, trying topic param vs figures topic", {
            syllabusTopic,
          });
          filtered = images.filter((img: any) => matchesTopicAgainst(img, topic));
          filtered = applySubjectFilter(filtered);
          console.log("[getChapterFigures] After topic filter", {
            filteredCount: filtered.length,
            imagesCount: images.length,
          });
        }

        let figures = filtered.map((img: any) => ({
          figure_number: img.figure_number || "",
          caption: img.caption || "",
          description: img.description || "",
          shortcode: img.shortcode || "",
          page_number: img.page_number || null,
          chapter: img.chapter || "",
          topic: img.topic || "",
        }));

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

        const shortcodesToUse = figures.map(
          (f: any) => `[image:${f.shortcode}]`,
        );

        console.log("[getChapterFigures] Success", {
          found: true,
          total: figures.length,
          chapter,
          topic: topic || null,
          shortcodesCount: shortcodesToUse.length,
        });

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
          shortcodes_ready_to_use: shortcodesToUse,
          usage: `You have figures available. You MUST include at least one image in your response. Use ONLY the format [image:shortcode]—copy-paste one of these EXACTLY: ${shortcodesToUse.join(" or ")}. Do NOT use markdown image syntax like ![caption](shortcode); only [image:shortcode] displays correctly.`,
          instruction: `MANDATORY: Include at least one of these shortcodes in your response using the exact format [image:shortcode] (e.g. ${shortcodesToUse[0] || "[image:shortcode]"}). Do NOT use ![](shortcode). Never tell the student there are no visual aids—you have them: ${shortcodesToUse.join(", ")}.`,
        };
      } catch (error: any) {
        console.error("[getChapterFigures] Outer catch error", {
          error: error?.message,
          stack: error?.stack,
          chapter,
          topic,
          subject,
        });
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
      console.log("[getSubjects] Entry", { includeLevels });
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

        console.log("[getSubjects] Success", {
          found: subjectList.length > 0,
          total: subjectList.length,
          subjectNames: subjectList.map((s: any) => s.name).slice(0, 5),
        });
        return {
          found: subjectList.length > 0,
          total: subjectList.length,
          subjects: subjectList,
          instruction:
            "Use this list to reference valid subjects. If the user's subject is not listed, ask them to choose from the available subjects.",
        };
      } catch (error: any) {
        console.error("[getSubjects] Error", {
          error: error?.message,
          stack: error?.stack,
        });
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
      console.log("[searchTextbooks] Entry", {
        query: query?.trim() || "(empty)",
        subject: subject || "(none)",
        level: level || "(none)",
      });
      if (!query?.trim()) {
        console.log("[searchTextbooks] Early exit: no query provided");
        return {
          found: false,
          message: "No search query provided",
          context: "",
        };
      }

      try {
        const queryContext =
          subject || level
            ? {
                subject: subject || undefined,
                level: level || undefined,
              }
            : undefined;

        const rawQuery = query.trim();
        const normalized = rawQuery.toLowerCase();
        const isSubjectTopicQuery =
          /(topics?|syllabus|outline|subject|about)/i.test(rawQuery);
        const cleanedQuery = normalized
          .replace(
            /what is|what are|about|topics?|subject|course|for|in|of/gi,
            " ",
          )
          .replace(/form\s*\d+/gi, " ")
          .replace(/[^a-z0-9\s]/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        const expandedQuery =
          isSubjectTopicQuery && cleanedQuery
            ? `${cleanedQuery} syllabus topics outline`
            : cleanedQuery;

        const fetchContext = async (q: string) =>
          fetchCombinedRAGContext(q, currentAuthToken, queryContext, {
            useLocal: false,
            useExternal: true,
            preferExternal: true,
          });

        let ragResult = await fetchContext(rawQuery);
        console.log("[searchTextbooks] Initial RAG fetch", {
          rawQuery,
          hasContext: !!(ragResult?.context?.trim()),
          source: ragResult?.source,
          contextLength: ragResult?.context?.length ?? 0,
        });
        if (
          (!ragResult.context || ragResult.context.trim().length === 0) &&
          expandedQuery &&
          expandedQuery !== rawQuery
        ) {
          ragResult = await fetchContext(expandedQuery);
          console.log("[searchTextbooks] Retry with expanded query", {
            expandedQuery,
            hasContext: !!(ragResult?.context?.trim()),
          });
        }

        if (!ragResult.context || ragResult.context.trim().length === 0) {
          console.log("[searchTextbooks] No context returned");
          return {
            found: false,
            query: query,
            message: "No textbook context returned.",
            context: "",
            instruction:
              "Answer using general knowledge. Do NOT say the information is unavailable. Clearly label the response as general knowledge (not from the textbooks) if needed.",
          };
        }

        let context = ragResult.context;
        const maxChars = ragResult.source === "combined" ? 5000 : 3500;
        if (context.length > maxChars) {
          context = context.slice(0, maxChars).trimEnd() + "...";
        }

        console.log("[searchTextbooks] Success", {
          found: true,
          source: ragResult.source,
          contextLength: context.length,
          truncated: context.length >= maxChars,
        });
        return {
          found: true,
          query: query,
          source: ragResult.source,
          context: context,
          hasExternalResults: !!ragResult.externalContext,
          instruction:
            "You MUST use the context above to answer. ALWAYS cite the source using format: 'According to [Book Title] ([Citation])...'. Do NOT use information outside this context.",
        };
      } catch (error: any) {
        console.error("[searchTextbooks] Error", {
          error: error?.message,
          stack: error?.stack,
          query,
        });
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
