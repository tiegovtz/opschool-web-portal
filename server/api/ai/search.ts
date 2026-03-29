import { defineEventHandler, readBody, getQuery } from "h3";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as { q?: string; query?: string };
    let body: { q?: string; query?: string } = {};
    try {
      body = await readBody(event);
    } catch (e) {
      // Body might be empty, that's okay
      body = {};
    }
    
    // Get search query from query params or body
    const searchQuery = query.q || query.query || body.query || body.q;
    
    console.log("[AI Search] Request received:", { 
      hasQuery: !!query.q || !!query.query, 
      hasBody: !!body.query || !!body.q,
      searchQuery: searchQuery?.substring(0, 50) 
    });
    
    if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
      console.warn("[AI Search] No search query provided");
      return {
        success: false,
        error: "Search query is required",
        answer: null,
        results: [],
      };
    }

    // Get API key using the same pattern as working endpoints
    const config = useRuntimeConfig();
    const apiKey = config.OPENAI_API_KEY || 
                   config.openaiApiKey || 
                   process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("[AI Search] Missing OpenAI API key");
      console.error("[AI Search] Config check:", {
        hasOPENAI_API_KEY: !!config.OPENAI_API_KEY,
        hasOpenaiApiKey: !!config.openaiApiKey,
        hasEnvOpenAI: !!process.env.OPENAI_API_KEY,
        configKeys: Object.keys(config).filter(k => k.toLowerCase().includes('openai')),
      });
      throw new Error("Missing OpenAI API key");
    }

    const openai = createOpenAI({ apiKey });

    // Get user token for traditional search fallback
    const userToken = event.headers.get("authorization")?.replace("Bearer ", "") || 
                      getCookie(event, "signInAccessToken") || 
                      "";

    // Perform traditional search for topics/subjects
    let traditionalResults: any[] = [];
    try {
      const searchUrl = userToken
        ? `${apiDocs.search.getSearch}?query=${encodeURIComponent(searchQuery.trim())}`
        : `${apiDocs.topics.filterTopics}?name=${encodeURIComponent(searchQuery.trim())}`;

      console.log("[AI Search] Performing traditional search:", searchUrl);
      const searchResponse = await $fetch(searchUrl, {
        method: "GET",
        headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
      });

      if (Array.isArray(searchResponse) && searchResponse.length > 0) {
        traditionalResults = searchResponse;
        console.log("[AI Search] Traditional search found", traditionalResults.length, "results");
      } else {
        console.log("[AI Search] Traditional search returned no results or invalid format");
      }
    } catch (error: any) {
      console.warn("[AI Search] Traditional search failed:", error?.message || error);
      // Continue without traditional results
    }

    // Generate AI answer using LLM
    const hasTopics = traditionalResults.length > 0;
    
    const systemPrompt = `You are TIE AI Search Assistant, a specialized educational assistant for the Tanzanian (NECTA) curriculum. Your role is to provide clear, concise answers to student questions based on the Tanzanian curriculum.

CURRICULUM RULES:
1. Your PRIMARY source of truth is the Tanzanian curriculum (NECTA).
2. You can answer questions about topics that are part of the Tanzanian curriculum (physics, chemistry, mathematics, biology, geography, etc.) as long as the question is clearly curriculum-related.
3. If necessary, you may use nearby East African curricula (Kenya, Uganda, Rwanda) ONLY as secondary references — NEVER as replacements.
4. ONLY refuse to answer if the question is clearly NOT related to the Tanzanian curriculum (e.g., current events, politics, non-educational topics).
5. Explanations must be clear, simple, step-by-step, and aligned with the Tanzanian syllabus.
6. Use Tanzanian context when providing examples (Tanzanian cities like Dar es Salaam, Arusha, Dodoma; Tanzanian culture, industries, geography, wildlife, agriculture, etc.).

${hasTopics ? `\nRelevant topics found in the platform: ${traditionalResults.map((r: any) => r.name || r.title).join(", ")}` : ""}

ANSWER INSTRUCTIONS:
1. Provide a direct, helpful answer to the user's question
2. If the question is about a curriculum topic (science, math, geography, etc.), answer it based on Tanzanian curriculum standards
3. If relevant topics were found, mention them briefly to guide the student
4. Keep answers concise (2-4 sentences maximum)
5. Use your knowledge of the Tanzanian curriculum to provide a helpful answer. Only refuse if the question is clearly outside the curriculum scope
6. Be encouraging and educational in tone
7. Always ensure your answer aligns with Tanzanian curriculum standards

User Question: "${searchQuery}"`;

    let aiAnswer = "";
    try {
      console.log("[AI Search] Generating AI answer...");
      const response = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: `Answer the following question: "${searchQuery}"`,
        temperature: 0.7,
        maxOutputTokens: 200,
      });

      aiAnswer = response.text.trim();
      console.log("[AI Search] AI answer generated successfully");
    } catch (error: any) {
      console.error("[AI Search] AI answer generation failed:", error?.message || error);
      // Fallback answer
      aiAnswer = traditionalResults.length > 0
        ? `I found ${traditionalResults.length} relevant topic${traditionalResults.length > 1 ? "s" : ""} for your search. Check the results below.`
        : "I couldn't find specific information to answer your question. Try searching with different keywords or browse topics by subject.";
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
    
    console.log("[AI Search] Response prepared:", {
      success: response.success,
      hasAnswer: !!response.answer,
      hasResults: Array.isArray(response.results),
      resultCount: response.resultCount,
      relatedTopics: response.relatedContent.topics.length,
      relatedVideos: response.relatedContent.videos.length,
      relatedAudio: response.relatedContent.audio.length,
      relatedExperiments: response.relatedContent.experiments.length,
      hasSuggestions: !!response.relatedContent.suggestions,
    });
    
    return response;
  } catch (error: any) {
    console.error("[AI Search] Error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "An error occurred during search",
      answer: null,
      results: [],
    };
  }
});
