import { tool } from "ai";
import { z } from "zod";
import { fetchCombinedRAGContext } from "../../utils/rag";
import apiDocs from "~/utilities/apiDocs";

let currentAuthToken: string | undefined = undefined;

export function setAuthTokenForTools(token: string | undefined): void {
  currentAuthToken = token;
}

const resolveApiUrl = (docUrl: string, fallbackPath: string) => {
  const baseUrl = apiDocs.baseURL;
  if (docUrl && !docUrl.includes("undefined")) {
    return docUrl.replace(apiDocs.baseURL || baseUrl, baseUrl);
  }
  return `${baseUrl}${fallbackPath}`;
};

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
  getChapterFigures: tool({
    description:
      "MANDATORY: Get all available image figures for a specific chapter and optional topic. You MUST call this tool whenever you are teaching a specific chapter or topic. This is the ONLY method to get images. Provide the chapter name exactly as given in the request or context. Returns a list of figures with shortcodes that you MUST use with [image:shortcode] format in your response. If figures are returned, you MUST include at least one [image:shortcode] in your response.",
    inputSchema: z.object({
      chapter: z
        .string()
        .describe(
          "Chapter name using WORD form for numbers (e.g., 'Chapter One', 'Chapter Two', 'Chapter Six') NOT digits.",
        ),
      topic: z
        .string()
        .optional()
        .describe("EXACT topic name from the user's message or context."),
      subject: z
        .string()
        .optional()
        .describe("Subject name to filter figures."),
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

          const filterOptions: {
            category?: string;
            chapter?: string;
            topic?: string;
          } = {};

          if (querySubject) {
            filterOptions.category = querySubject;
          }

          if (chapter) {
            filterOptions.chapter = chapter;
          }

          if (topic && topic.trim() && topic.trim().toLowerCase() !== "all") {
            filterOptions.topic = topic;
          }

          console.log("[getChapterFigures] Fetching figures with options:", {
            filterOptions,
            hasToken: !!currentAuthToken,
            chapter,
            topic,
            subject: querySubject,
          });

          let figures = await getFigures(filterOptions, currentAuthToken);

          if (
            figures.length === 0 &&
            querySubject &&
            (filterOptions.chapter || filterOptions.topic)
          ) {
            console.log(
              "[getChapterFigures] No figures with filters, trying with category only",
            );
            figures = await getFigures(
              { category: querySubject },
              currentAuthToken,
            );
          }

          if (figures.length === 0 && querySubject) {
            console.log(
              "[getChapterFigures] No figures with category, trying all figures",
            );
            figures = await getFigures({}, currentAuthToken);
          }

          console.log("[getChapterFigures] Found figures:", figures.length);

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
          return {
            found: false,
            message:
              "No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.",
            figures: [],
          };
        }

        const normalizeChapter = (ch: string) =>
          ch.toLowerCase().trim().replace(/\s+/g, " ");
        const normalizeTopic = (t: string) =>
          t.toLowerCase().trim().replace(/\s+/g, " ");

        const queryChapter = normalizeChapter(chapter);

        let filtered = images.filter((img: any) => {
          const imgChapter = normalizeChapter(img.chapter || "");
          const matchesChapter = imgChapter === queryChapter;

          if (querySubject && matchesChapter) {
            const imgSubject = (img.subject || "").toLowerCase();
            const imgShortcode = (img.shortcode || "").toLowerCase();

            const subjectMatch =
              imgSubject === querySubject ||
              imgShortcode.startsWith(querySubject);
            return subjectMatch;
          }

          return matchesChapter;
        });

        if (filtered.length === 0) {
          const chapterNumMatch = chapter.match(
            /chapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)/i,
          );
          if (chapterNumMatch) {
            const numberStr = chapterNumMatch[1].toLowerCase();
            const wordToDigit: Record<string, string> = {
              one: "1",
              two: "2",
              three: "3",
              four: "4",
              five: "5",
              six: "6",
              seven: "7",
              eight: "8",
              nine: "9",
              ten: "10",
            };
            const digitToWord: Record<string, string> = {
              "1": "one",
              "2": "two",
              "3": "three",
              "4": "four",
              "5": "five",
              "6": "six",
              "7": "seven",
              "8": "eight",
              "9": "nine",
              "10": "ten",
            };
            const wordToWord: Record<string, string> = {
              one: "one",
              two: "two",
              three: "three",
              four: "four",
              five: "five",
              six: "six",
              seven: "seven",
              eight: "eight",
              nine: "nine",
              ten: "ten",
            };

            const isDigit = /^\d+$/.test(numberStr);
            const chapterWord = isDigit
              ? digitToWord[numberStr]
              : wordToWord[numberStr] || null;
            const chapterDigit = isDigit
              ? numberStr
              : wordToDigit[numberStr] || numberStr;

            filtered = images.filter((img: any) => {
              const imgChapter = normalizeChapter(img.chapter || "");

              const matchesChapterNumber =
                imgChapter.startsWith(`chapter ${chapterWord}:`) ||
                imgChapter.startsWith(`chapter ${chapterDigit}:`);

              if (!matchesChapterNumber) return false;

              if (querySubject) {
                const imgSubject = (img.subject || "").toLowerCase();
                const imgShortcode = (img.shortcode || "").toLowerCase();

                const subjectMatch =
                  imgSubject === querySubject ||
                  imgShortcode.startsWith(querySubject);
                return subjectMatch;
              }

              return true;
            });
          }
        }

        if (topic && topic.trim() && topic.trim().toLowerCase() !== "all") {
          const queryTopic = normalizeTopic(topic);
          const queryWords = queryTopic
            .split(/\s+/)
            .filter((w) => w.length > 2);
          const isSingleWord = queryWords.length === 1;

          let exactMatches = filtered.filter((img: any) => {
            const imgTopic = normalizeTopic(img.topic || "");
            return imgTopic === queryTopic;
          });

          if (exactMatches.length > 0 && !isSingleWord) {
            filtered = exactMatches;
          } else {
            filtered = filtered.filter((img: any) => {
              const imgTopic = normalizeTopic(img.topic || "");
              const imgCaption = normalizeTopic(img.caption || "");

              if (imgTopic === queryTopic) return true;

              if (isSingleWord) {
                if (imgTopic.includes(queryWords[0])) return true;
                if (imgCaption.includes(queryWords[0])) return true;
                return false;
              }

              if (imgTopic.includes(queryTopic)) return true;
              if (imgCaption.includes(queryTopic)) return true;

              return false;
            });
          }
        }

        const figures = filtered.map((img: any) => ({
          figure_number: img.figure_number || "",
          caption: img.caption || "",
          description: img.description || "",
          shortcode: img.shortcode || "",
          page_number: img.page_number || null,
          chapter: img.chapter || "",
          topic: img.topic || "",
        }));

        if (figures.length === 0) {
          return {
            found: false,
            message: `No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.`,
            figures: [],
          };
        }

        const shortcodesToUse = figures.map(
          (f: any) => `[image:${f.shortcode}]`,
        );

        return {
          found: true,
          total: figures.length,
          chapter: chapter,
          topic: topic || null,
          figures: figures,
          shortcodes_ready_to_use: shortcodesToUse,
          usage: `CRITICAL: You MUST include at least one image in your response. Copy-paste one of these EXACTLY into your response: ${shortcodesToUse.join(" or ")}.`,
          instruction: `MANDATORY: Include at least one of these shortcodes in your response text: ${shortcodesToUse.join(", ")}.`,
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
        if (
          (!ragResult.context || ragResult.context.trim().length === 0) &&
          expandedQuery &&
          expandedQuery !== rawQuery
        ) {
          ragResult = await fetchContext(expandedQuery);
        }

        if (!ragResult.context || ragResult.context.trim().length === 0) {
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
