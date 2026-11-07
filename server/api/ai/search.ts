import { defineEventHandler, readBody, getQuery, createError } from "h3";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import apiDocs from "~/utilities/apiDocs";
import { searchTextbookPassages } from "../../utils/textbookSearch";
import { readSessionToken } from "../../utils/sessionAuth";
import { classifyChatError, logChatError } from "../../utils/chatErrors";

type SearchLanguage = "english" | "kiswahili";

const NOT_FOUND_TEXT: Record<SearchLanguage, string> = {
  english: "I couldn't find this in the textbooks yet. Try different keywords or browse the topics below.",
  kiswahili: "Sikupata jambo hili kwenye vitabu bado. Jaribu maneno mengine au pitia mada zilizo hapa chini.",
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { q?: string; query?: string; language?: string };
  let body: { q?: string; query?: string; language?: string } = {};
  try {
    body = (await readBody(event)) || {};
  } catch {
    // Body might be empty, that's okay
    body = {};
  }

  // Get search query from query params or body
  const searchQuery = query.q || query.query || body.query || body.q;
  const rawLanguage = String(body.language || query.language || "").trim().toLowerCase();
  const language: SearchLanguage = rawLanguage === "kiswahili" ? "kiswahili" : "english";

  if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: "Search query is required",
      data: { code: "validation", reason: "empty_message" },
    });
  }
  if (searchQuery.length > 500) {
    throw createError({
      statusCode: 400,
      message: "Search query is too long",
      data: { code: "validation" },
    });
  }

  const config = useRuntimeConfig();
  const apiKey = String(config.OPENAI_API_KEY || config.openaiApiKey || process.env.OPENAI_API_KEY || "");
  if (!apiKey) {
    console.error("[AI Search] OPENAI_API_KEY is not configured");
    throw createError({
      statusCode: 503,
      message: "The AI service is not configured.",
      data: { code: "provider" },
    });
  }

  try {
    const openai = createOpenAI({ apiKey });

    // Same token the ai-auth middleware validated.
    const userToken = readSessionToken(event) || "";

    // Perform traditional search for topics/subjects
    let traditionalResults: any[] = [];
    try {
      const searchUrl = userToken
        ? `${apiDocs.search.getSearch}?query=${encodeURIComponent(searchQuery.trim())}`
        : `${apiDocs.topics.filterTopics}?name=${encodeURIComponent(searchQuery.trim())}`;

      const searchResponse = await $fetch(searchUrl, {
        method: "GET",
        headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
      });

      if (Array.isArray(searchResponse) && searchResponse.length > 0) {
        traditionalResults = searchResponse;
      }
    } catch (error: any) {
      console.warn("[AI Search] Traditional search failed:", error?.message || error);
      // Continue without traditional results
    }

    // Ground the answer in the textbooks with the same retrieval as the AI teacher.
    const textbook = await searchTextbookPassages(searchQuery, {
      caller: "home-search",
      maxChars: 6000,
    });
    const citations = textbook.status === "found" ? textbook.citations : [];

    const hasTopics = traditionalResults.length > 0;
    const languageName = language === "kiswahili" ? "Kiswahili" : "English";
    const textbookSection =
      textbook.status === "found"
        ? `TEXTBOOK PASSAGES (answer ONLY from these, and mention the book title):\n${textbook.context}`
        : textbook.status === "not_found"
          ? "TEXTBOOK PASSAGES: none found for this question."
          : "TEXTBOOK PASSAGES: textbook search is unavailable right now (technical error).";

    const systemPrompt = `You are TIE AI Search Assistant, a specialized educational assistant for the Tanzanian (NECTA) curriculum. Give students a clear, short answer grounded in their textbooks.

LANGUAGE: Answer in ${languageName}.

RULES:
1. If TEXTBOOK PASSAGES are provided, answer ONLY from them and mention the book title (e.g. "According to Biology Form 1...").
2. If no passages were found, say briefly that the textbooks do not cover this yet and suggest trying other keywords. Do NOT answer from your own knowledge.
3. If textbook search is unavailable, say that textbook search is unavailable right now and suggest trying again in a few minutes. Do NOT answer from your own knowledge.
4. ONLY refuse if the question is clearly NOT related to the Tanzanian curriculum (e.g., current events, politics, non-educational topics).
5. Use Tanzanian context in examples (Dar es Salaam, Arusha, Dodoma, local farming, markets, wildlife).
6. Keep the answer concise (2-5 sentences); show short calculations completely.
${hasTopics ? `\nRelevant topics found in the platform (you may mention them briefly): ${traditionalResults.map((r: any) => r.name || r.title).join(", ")}` : ""}

${textbookSection}`;

    let aiAnswer: string | null = null;
    let answerError: { code: string } | null = null;
    if (textbook.status === "not_found") {
      // Nothing to ground on: say so plainly instead of a model guess.
      aiAnswer = NOT_FOUND_TEXT[language];
    } else {
      try {
        const response = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          prompt: `Student question: "${searchQuery}"`,
          temperature: 0.4,
          maxOutputTokens: 400,
        });
        aiAnswer = response.text.trim() || null;
        if (!aiAnswer) {
          answerError = { code: "provider" };
          console.error("[AI Search] Empty AI answer");
        }
      } catch (error: any) {
        logChatError("ai-search", error);
        // No canned fallback: the UI shows a specific, localized message.
        answerError = { code: classifyChatError(error) };
      }
    }

    // 3.5. Extract keywords/concepts from the query using AI for better material discovery
    let searchKeywords: string[] = [];
    let suggestedSubjects: string[] = [];

    try {
      // Use AI to extract key concepts and subjects from the query
      const keywordPrompt = `Extract the main educational concepts, topics, and subject areas from this student question: "${searchQuery}"

Return a JSON object with:
- keywords: array of 3-5 key terms/concepts (e.g., ["force", "motion", "physics"])
- subjects: array of relevant subjects (e.g., ["physics", "science"])

Only include curriculum-related terms. Example for "how does something float": 
{"keywords": ["buoyancy", "float", "density", "water", "physics"], "subjects": ["physics", "science"]}`;

      const keywordResponse = await generateText({
        model: openai("gpt-4o-mini"),
        system: "You are a helpful assistant that extracts educational keywords from student questions. Return only valid JSON.",
        prompt: keywordPrompt,
        temperature: 0.3,
        maxOutputTokens: 150,
      });

      try {
        // Try to parse JSON response
        const responseText = keywordResponse.text.trim();
        // Remove markdown code blocks if present
        const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const extracted = JSON.parse(jsonText);
        searchKeywords = extracted.keywords || [];
        suggestedSubjects = extracted.subjects || [];
        console.log("[AI Search] Extracted keywords:", searchKeywords, "Subjects:", suggestedSubjects);
      } catch (parseError) {
        // Fallback: use simple keyword extraction
        const words = searchQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        searchKeywords = words.slice(0, 5);
        console.log("[AI Search] JSON parse failed, using fallback keywords:", searchKeywords);
      }
    } catch (error: any) {
      console.warn("[AI Search] Keyword extraction failed:", error?.message || error);
      // Fallback: use query words as keywords
      const words = searchQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      searchKeywords = words.slice(0, 5);
    }

    // 4. Fetch related content based on search results OR extracted keywords
    const relatedContent = {
      topics: [] as any[],
      videos: [] as any[],
      audio: [] as any[],
      experiments: [] as any[],
      suggestions: "" as string,
    };

    // 4a. Determine subjects to search - use traditional results OR AI-extracted subjects
    let subjectsToSearch: string[] = [];
    let subjectIdsToSearch: string[] = [];

    if (traditionalResults.length > 0) {
      // Use subjects from traditional search results
      subjectsToSearch = [...new Set(
        traditionalResults
          .map((r: any) => r.subject?.name || r.subject)
          .filter(Boolean)
      )];
      
      subjectIdsToSearch = [...new Set(
        traditionalResults
          .map((r: any) => r.subject?._id || r.subject)
          .filter(Boolean)
      )];

      console.log("[AI Search] Using subjects from search results:", subjectsToSearch);
    } else {
      // NEW: If no traditional results, use AI-extracted subjects or search by keywords
      subjectsToSearch = suggestedSubjects;
      
      // Try to find subject IDs from subject names
      if (suggestedSubjects.length > 0) {
        try {
          const allSubjects = await $fetch(apiDocs.subjects.getPublicSubjects, {
            method: "GET",
            headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
          });
          
          if (Array.isArray(allSubjects)) {
            subjectIdsToSearch = allSubjects
              .filter((s: any) => suggestedSubjects.some((sub: string) => 
                s.name?.toLowerCase().includes(sub.toLowerCase()) || 
                sub.toLowerCase().includes(s.name?.toLowerCase())
              ))
              .map((s: any) => s._id)
              .slice(0, 3);
            console.log("[AI Search] Found subject IDs from AI extraction:", subjectIdsToSearch);
          }
        } catch (error: any) {
          console.warn("[AI Search] Subject lookup failed:", error?.message || error);
        }
      }
      
      // Also try searching topics by keywords if we have them and no subject IDs yet
      if (searchKeywords.length > 0 && subjectIdsToSearch.length === 0) {
        console.log("[AI Search] Searching topics by keywords:", searchKeywords);
        for (const keyword of searchKeywords.slice(0, 3)) {
          try {
            const keywordResults = await $fetch(`${apiDocs.topics.filterTopics}?name=${encodeURIComponent(keyword)}`, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            
            if (Array.isArray(keywordResults) && keywordResults.length > 0) {
              // Add to traditional results if not already there
              keywordResults.forEach((r: any) => {
                if (!traditionalResults.some((tr: any) => tr._id === r._id)) {
                  traditionalResults.push(r);
                }
              });
              
              // Extract subjects from these results
              const newSubjectIds = keywordResults
                .map((r: any) => r.subject?._id || r.subject)
                .filter(Boolean);
              subjectIdsToSearch.push(...newSubjectIds);
              console.log("[AI Search] Found", keywordResults.length, "topics for keyword:", keyword);
            }
          } catch (error: any) {
            console.warn("[AI Search] Keyword topic search failed:", error?.message || error);
          }
        }
        
        // Deduplicate
        subjectIdsToSearch = [...new Set(subjectIdsToSearch)];
        traditionalResults = traditionalResults.filter((r: any, index: number, self: any[]) => 
          index === self.findIndex((t: any) => t._id === r._id)
        );
      }
    }

    // 4b. Find related topics from subjects (whether from results or AI extraction)
    if (subjectIdsToSearch.length > 0) {
      console.log("[AI Search] Finding related topics for subjects:", subjectIdsToSearch);

      for (const subjectId of subjectIdsToSearch.slice(0, 3)) { // Limit to 3 subjects
        try {
          const relatedTopicsUrl = `${apiDocs.topics.getSubjectId.replace("{subjectId}", subjectId)}`;
          const relatedTopics = await $fetch(relatedTopicsUrl, {
            method: "GET",
            headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
          });

          if (Array.isArray(relatedTopics)) {
            // Filter out already returned results and get top 5 related
            const filtered = relatedTopics
              .filter((t: any) => !traditionalResults.some((tr: any) => tr._id === t._id))
              .slice(0, 5);
            
            relatedContent.topics.push(...filtered);
            console.log("[AI Search] Found", filtered.length, "related topics for subject", subjectId);
          }
        } catch (error: any) {
          console.warn("[AI Search] Related topics search failed for subject", subjectId, ":", error?.message || error);
        }
      }

      // Limit total related topics to 8
      relatedContent.topics = relatedContent.topics.slice(0, 8);
    }

    // 4c. Find related videos, audio, and experiments from subjects
    if (subjectIdsToSearch.length > 0) {
      for (const subjectId of subjectIdsToSearch.slice(0, 3)) {
        try {
          // Fetch related videos
          try {
            const videosUrl = `${apiDocs.videos.getPublicVideoBySubjectId.replace("{subjectId}", subjectId)}`;
            const videos = await $fetch(videosUrl, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            if (Array.isArray(videos)) {
              relatedContent.videos.push(...videos.slice(0, 3));
            }
          } catch (error) {
            console.warn("[AI Search] Related videos fetch failed:", error);
          }

          // Fetch related audio
          try {
            const audioUrl = `${apiDocs.audio.getPublicAudioBySubjectId.replace("{subjectId}", subjectId)}`;
            const audio = await $fetch(audioUrl, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            if (Array.isArray(audio)) {
              relatedContent.audio.push(...audio.slice(0, 3));
            }
          } catch (error) {
            console.warn("[AI Search] Related audio fetch failed:", error);
          }

          // Fetch related experiments
          try {
            const experimentsUrl = `${apiDocs.experiments.getPublicExperimentsBySubjectId.replace("{subjectId}", subjectId)}`;
            const experiments = await $fetch(experimentsUrl, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            if (Array.isArray(experiments)) {
              relatedContent.experiments.push(...experiments.slice(0, 3));
            }
          } catch (error) {
            console.warn("[AI Search] Related experiments fetch failed:", error);
          }
        } catch (error) {
          console.warn("[AI Search] Related content fetch failed:", error);
        }
      }
    }

    // 4d. Fallback: Search all public materials by keywords if we still don't have enough
    const hasEnoughContent = relatedContent.videos.length > 0 || 
                            relatedContent.audio.length > 0 || 
                            relatedContent.experiments.length > 0 ||
                            relatedContent.topics.length > 0;

    if (!hasEnoughContent && searchKeywords.length > 0) {
      console.log("[AI Search] Not enough content found, searching by keywords:", searchKeywords);
      
      // Search all public videos, audio, experiments with keywords
      for (const keyword of searchKeywords.slice(0, 2)) {
        try {
          // Search videos
          try {
            const allVideos = await $fetch(apiDocs.videos.getPublicVideo, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            if (Array.isArray(allVideos)) {
              const matchingVideos = allVideos.filter((v: any) => 
                v.name?.toLowerCase().includes(keyword.toLowerCase()) ||
                v.description?.toLowerCase().includes(keyword.toLowerCase()) ||
                v.title?.toLowerCase().includes(keyword.toLowerCase())
              ).slice(0, 2);
              relatedContent.videos.push(...matchingVideos);
              console.log("[AI Search] Found", matchingVideos.length, "videos for keyword:", keyword);
            }
          } catch (error) {
            console.warn("[AI Search] Keyword video search failed:", error);
          }
          
          // Search audio
          try {
            const allAudio = await $fetch(apiDocs.audio.getPublicAudio, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            if (Array.isArray(allAudio)) {
              const matchingAudio = allAudio.filter((a: any) => 
                a.name?.toLowerCase().includes(keyword.toLowerCase()) ||
                a.description?.toLowerCase().includes(keyword.toLowerCase()) ||
                a.title?.toLowerCase().includes(keyword.toLowerCase())
              ).slice(0, 2);
              relatedContent.audio.push(...matchingAudio);
              console.log("[AI Search] Found", matchingAudio.length, "audio for keyword:", keyword);
            }
          } catch (error) {
            console.warn("[AI Search] Keyword audio search failed:", error);
          }
          
          // Search experiments
          try {
            const allExperiments = await $fetch(apiDocs.experiments.getPublicExperiments, {
              method: "GET",
              headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
            });
            if (Array.isArray(allExperiments)) {
              const matchingExperiments = allExperiments.filter((e: any) => 
                e.name?.toLowerCase().includes(keyword.toLowerCase()) ||
                e.description?.toLowerCase().includes(keyword.toLowerCase()) ||
                e.title?.toLowerCase().includes(keyword.toLowerCase())
              ).slice(0, 2);
              relatedContent.experiments.push(...matchingExperiments);
              console.log("[AI Search] Found", matchingExperiments.length, "experiments for keyword:", keyword);
            }
          } catch (error) {
            console.warn("[AI Search] Keyword experiment search failed:", error);
          }
        } catch (error) {
          console.warn("[AI Search] Keyword material search failed:", error);
        }
      }
      
      // Deduplicate
      relatedContent.videos = relatedContent.videos.filter((v: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t._id === v._id)
      );
      relatedContent.audio = relatedContent.audio.filter((a: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t._id === a._id)
      );
      relatedContent.experiments = relatedContent.experiments.filter((e: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t._id === e._id)
      );
    }

    // Limit each category
    relatedContent.videos = relatedContent.videos.slice(0, 5);
    relatedContent.audio = relatedContent.audio.slice(0, 5);
    relatedContent.experiments = relatedContent.experiments.slice(0, 5);

    // 4c. Generate AI suggestions for related content
    if (traditionalResults.length > 0 || relatedContent.topics.length > 0) {
      try {
        const foundTopics = traditionalResults.map((r: any) => r.name || r.title).join(", ");
        const relatedTopicsList = relatedContent.topics.map((t: any) => t.name || t.title).join(", ");
        
        const relatedPrompt = `Based on the search query "${searchQuery}" and the found topics: ${foundTopics || "none"}, suggest 3-5 related educational topics, chapters, or materials that Tanzanian students might find helpful for further learning. 

${relatedTopicsList ? `Related topics already found: ${relatedTopicsList}` : ""}

Provide a brief, encouraging list of suggestions that align with the Tanzanian (NECTA) curriculum. Keep it concise (2-3 sentences).`;

        const relatedResponse = await generateText({
          model: openai("gpt-4o-mini"),
          system: "You are a helpful educational assistant for Tanzanian students. Suggest related educational content that helps students learn more.",
          prompt: relatedPrompt,
          temperature: 0.7,
          maxOutputTokens: 150,
        });

        relatedContent.suggestions = relatedResponse.text.trim();
        console.log("[AI Search] AI suggestions generated");
      } catch (error: any) {
        console.warn("[AI Search] AI related suggestions failed:", error?.message || error);
        // Fallback suggestion
        if (relatedContent.topics.length > 0) {
          relatedContent.suggestions = `You might also find these related topics helpful: ${relatedContent.topics.slice(0, 3).map((t: any) => t.name || t.title).join(", ")}.`;
        }
      }
    }

    // 5. Return combined results with related content
    const response = {
      success: true,
      answer: aiAnswer,
      answerError,
      textbookStatus: textbook.status === "error" ? "unavailable" : textbook.status,
      citations,
      language,
      results: traditionalResults,
      relatedContent: {
        topics: relatedContent.topics,
        videos: relatedContent.videos,
        audio: relatedContent.audio,
        experiments: relatedContent.experiments,
        suggestions: relatedContent.suggestions,
      },
      resultCount: traditionalResults.length,
    };
    
    return response;
  } catch (error: any) {
    logChatError("ai-search", error);
    throw createError({
      statusCode: 500,
      message: "AI search failed",
      data: { code: "provider" },
    });
  }
});
