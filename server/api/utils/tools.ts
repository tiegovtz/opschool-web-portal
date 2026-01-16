import { tool } from "ai";
import { z } from "zod";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Syllabus } from "~/types/syllabus.interface";
import { embedQuery } from "./embeddings";

/**
 * Read syllabus from JSON file
 */
async function readSyllabusFromFile(subject: string, level: string): Promise<Syllabus | null> {
  try {
    // Normalize subject: lowercase, replace spaces with underscores
    const normalizedSubject = subject.toLowerCase().trim().replace(/\s+/g, "_");
    
    // Normalize level: convert "Form I" -> "form1", "Form II" -> "form2", etc.
    let normalizedLevel = level.toLowerCase().trim();
    // Handle Roman numerals and numbers
    normalizedLevel = normalizedLevel.replace(/form\s*i+$/i, "form1"); // Form I, form i, FORM I -> form1
    normalizedLevel = normalizedLevel.replace(/form\s*ii+$/i, "form2"); // Form II, form ii, FORM II -> form2
    normalizedLevel = normalizedLevel.replace(/form\s*1$/i, "form1"); // Form 1 -> form1
    normalizedLevel = normalizedLevel.replace(/form\s*2$/i, "form2"); // Form 2 -> form2
    // If it still has spaces, replace with nothing
    normalizedLevel = normalizedLevel.replace(/\s+/g, "");
    
    // Construct filename: syllabus_{subject}_{level}.json
    const filename = `syllabus_${normalizedSubject}_${normalizedLevel}.json`;
    
    // Primary path - should work in Nuxt server context
    const syllabusDir = join(process.cwd(), "server", "data", "syllabus");
    const filePath = join(syllabusDir, filename);
    
    console.log(`[getSyllabus] Normalized: subject="${normalizedSubject}", level="${normalizedLevel}"`);
    console.log(`[getSyllabus] Looking for filename: ${filename}`);
    console.log(`[getSyllabus] Current working directory: ${process.cwd()}`);
    console.log(`[getSyllabus] Full file path: ${filePath}`);
    
    // List available files for debugging
    try {
      const files = await readdir(syllabusDir);
      console.log(`[getSyllabus] Available files in syllabus directory:`, files);
      if (!files.includes(filename)) {
        console.warn(`[getSyllabus] ⚠️ File ${filename} not found. Available: ${files.join(", ")}`);
      }
    } catch (dirError: any) {
      console.warn(`[getSyllabus] Could not list directory:`, dirError.message);
    }
    
    try {
      console.log(`[getSyllabus] Attempting to read: ${filePath}`);
      const fileContent = await readFile(filePath, "utf-8");
      const syllabus: Syllabus = JSON.parse(fileContent);
      console.log(`[getSyllabus] ✅ Successfully loaded syllabus: ${syllabus.syllabus_title}`);
      return syllabus;
    } catch (readError: any) {
      console.error(`[getSyllabus] ❌ Failed to read file: ${readError.message}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[getSyllabus] Unexpected error:`, error.message);
    return null;
  }
}

/**
 * Format syllabus content for the AI agent
 */
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

/**
 * Load image shortcodes from JSON file
 */
async function loadImageShortcodesFromFile(): Promise<{
  shortcodes: Record<string, any>;
  total: number;
  byCategory: Record<string, number>;
} | null> {
  try {
    const filePath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return {
      shortcodes: data.shortcodes || {},
      total: data.total || 0,
      byCategory: data.byCategory || {}
    };
  } catch (error: any) {
    console.error('[getImageShortcodes] Failed to load:', error.message);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export const studentTools = {
  // Get syllabus for a subject and level from JSON files
  getSyllabus: tool({
    description: "Get the syllabus/curriculum for a given subject and level (Form I or Form II) from JSON files. Use this when you need to understand what competences, topics, or content should be covered for a specific subject and level. This helps ensure syllabus compliance and proper lesson planning. Available subjects: biology, physics. Available levels: Form I, Form II.",
    inputSchema: z.object({ 
      subject: z.string().describe("The subject name (e.g., 'biology', 'physics', 'mathematics', 'chemistry', 'geography', 'history', 'english', 'kiswahili')"),
      level: z.string().describe("The education level (e.g., 'Form I', 'Form II', 'form i', 'form ii')")
    }),
    execute: async ({ subject, level }) => {
      try {
        console.log(`[getSyllabus] Requested: subject=${subject}, level=${level}`);
        const syllabus = await readSyllabusFromFile(subject, level);
        
        if (!syllabus) {
          return {
            subject,
            level,
            syllabus: `No syllabus file found for ${subject} ${level}. Available files: biology (Form I, Form II), physics (Form I). You may need to rely on general knowledge of the Tanzanian curriculum for other subjects.`,
            found: false,
            competences: []
          };
        }

        // Format syllabus for the agent
        const formattedSyllabus = formatSyllabusForAgent(syllabus);
        
        return {
          subject: syllabus.syllabus_title.includes(subject) ? subject : syllabus.syllabus_title,
          level: syllabus.level,
          syllabus: formattedSyllabus,
          competences: syllabus.content.map((c) => ({
            main: c.main_competence,
            specific: c.specific_competence,
            periods: c.number_of_periods,
            activities: c.learning_activities.length
          })),
          totalCompetences: syllabus.content.length,
          found: true
        };
      } catch (error: any) {
        console.error("[getSyllabus] Error:", error);
        return {
          subject,
          level,
          syllabus: `Error retrieving syllabus: ${error.message}`,
          found: false,
          error: true,
          competences: []
        };
      }
    },
  }),

  // Convert Fahrenheit to Celsius
  convertFahrenheitToCelsius: tool({
    description: "Convert a temperature in Fahrenheit to Celsius",
    inputSchema: z.object({ temperature: z.number() }),
    execute: async ({ temperature }) => ({
      celsius: Math.round((temperature - 32) * (5 / 9)),
    }),
  }),

  // Simple Math Evaluator
  math: tool({
    description: "Evaluate basic math expressions",
    inputSchema: z.object({ expression: z.string() }),
    execute: async ({ expression }) => {
      try {
        const result = eval(expression); // basic, replace with safer parser in prod
        return { result };
      } catch {
        return { result: "Invalid expression" };
      }
    },
  }),

  // Temperature generator (example tool)
  weather: tool({
    description: "Get the weather in a location (Fahrenheit)",
    inputSchema: z.object({ location: z.string() }),
    execute: async ({ location }) => ({
      location,
      temperature: Math.round(Math.random() * (90 - 32) + 32),
    }),
  }),

  // Get image shortcodes using semantic search
  getImageShortcodes: tool({
    description: "Search for image shortcodes from lesson chapters using hybrid keyword and semantic search for high accuracy. ALWAYS use this tool when explaining concepts - images are mandatory. The tool combines semantic search (meaning-based) and keyword matching to find the most relevant images. Returns shortcodes with similarity scores - use images with similarity > 0.3. Returns shortcodes you can use with [image:shortcode] format. The shortcodes are generated from descriptions of images in lesson chapters. Example: When explaining 'cell structure', call this tool with query='cell structure diagram', category='biology' to find relevant images.",
    inputSchema: z.object({
      query: z.string().describe("Natural language query describing what image you need (e.g., 'diagram showing how plants make food', 'electrical circuit', 'cell division process', 'wave properties')"),
      category: z.enum(['biology', 'physics', 'chemistry', 'mathematics', 'general', 'all']).optional().default('all').describe("Filter by subject category"),
      limit: z.number().optional().default(10).describe("Maximum number of results (default: 10, max: 20)"),
      minSimilarity: z.number().optional().default(0.3).describe("Minimum similarity score (0-1, default: 0.3). The hybrid search (semantic + keyword) provides high accuracy, so 0.3 is sufficient for good results.")
    }),
    execute: async ({ query, category = 'all', limit = 10, minSimilarity = 0.3 }) => {
      try {
        console.log(`[getImageShortcodes] 🔍 TOOL CALLED - Searching for: "${query}", category: ${category}, limit: ${limit}`);
        
        const data = await loadImageShortcodesFromFile();
        
        if (!data || Object.keys(data.shortcodes).length === 0) {
          return {
            found: false,
            message: "No image shortcodes available. The image list may not have been generated yet. Access /image-list to generate shortcodes.",
            shortcodes: [],
            total: 0
          };
        }

        // 1. Generate embedding for the search query
        let queryEmbedding: number[];
        try {
          queryEmbedding = await embedQuery(query);
        } catch (embedError: any) {
          console.error("[getImageShortcodes] Failed to generate query embedding:", embedError);
          return {
            found: false,
            error: `Failed to process search query: ${embedError.message}`,
            shortcodes: []
          };
        }

        // 2. Calculate similarity for each shortcode using improved hybrid search
        const scored: Array<{
          shortcode: string;
          metadata: any;
          score: number;
        }> = [];

        let checkedCount = 0;
        let withEmbeddings = 0;
        const queryLower = query.toLowerCase().trim();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1); // Words longer than 1 char
        const queryLength = queryWords.length;

        // Helper function for advanced keyword matching with field-specific boosting
        function calculateKeywordScore(text: string, fieldWeight: number = 1.0): number {
          if (!text) return 0;
          const textLower = text.toLowerCase();
          let score = 0;

          // 1. Exact phrase match (highest priority)
          if (textLower.includes(queryLower)) {
            score = Math.max(score, 0.9 * fieldWeight);
          }

          // 2. All words present in order (high relevance)
          if (queryWords.length > 1) {
            const wordsInOrder = queryWords.every((word, idx) => {
              const pos = textLower.indexOf(word);
              if (pos === -1) return false;
              // Check if words appear in roughly the same order
              if (idx === 0) return true;
              const prevWord = queryWords[idx - 1];
              const prevPos = textLower.indexOf(prevWord);
              return pos >= prevPos; // Current word comes after previous
            });
            if (wordsInOrder) {
              score = Math.max(score, 0.75 * fieldWeight);
            }
          }

          // 3. All words present (any order)
          const allWordsPresent = queryWords.every(word => textLower.includes(word));
          if (allWordsPresent) {
            score = Math.max(score, 0.65 * fieldWeight);
          }

          // 4. Partial word matches (fuzzy matching)
          const matchingWords = queryWords.filter(word => {
            // Exact word match
            if (textLower.includes(word)) return true;
            // Partial match (word contains query word or vice versa)
            const words = textLower.split(/\s+/);
            return words.some(tw => tw.includes(word) || word.includes(tw));
          });
          
          if (matchingWords.length > 0) {
            const matchRatio = matchingWords.length / queryLength;
            // Base score increases with match ratio
            const baseScore = 0.3 + (matchRatio * 0.4); // Range: 0.3 to 0.7
            score = Math.max(score, baseScore * fieldWeight);
          }

          // 5. Single word exact match (for short queries)
          if (queryLength === 1 && textLower.includes(queryWords[0])) {
            score = Math.max(score, 0.5 * fieldWeight);
          }

          return Math.min(score, 1.0); // Cap at 1.0
        }

        for (const [shortcode, metadata] of Object.entries(data.shortcodes)) {
          // Filter by category first
          if (category !== 'all' && metadata.category !== category) {
            continue;
          }

          checkedCount++;

          // IMPROVED HYBRID SEARCH: Enhanced semantic + advanced keyword matching
          let semanticScore = 0;
          let keywordScore = 0;
          let hasEmbedding = false;

          // 1. Semantic search (meaning-based) - if embedding is available
          if (metadata.embedding && Array.isArray(metadata.embedding)) {
            withEmbeddings++;
            hasEmbedding = true;
            semanticScore = cosineSimilarity(queryEmbedding, metadata.embedding);
            // Normalize semantic score (cosine similarity is already -1 to 1, but we want 0 to 1)
            semanticScore = Math.max(0, semanticScore);
          }

          // 2. Advanced keyword search with field-specific boosting
          // Higher weight for more important fields (alt > description > chapter/topic)
          const altText = (metadata.alt || '').toLowerCase();
          const description = (metadata.description || '').toLowerCase();
          const chapterName = (metadata.chapterName || '').toLowerCase();
          const topicName = (metadata.topicName || '').toLowerCase();
          const subjectName = (metadata.subjectName || '').toLowerCase();
          const shortcodeText = shortcode.toLowerCase();

          // Calculate keyword scores for each field with different weights
          const altScore = calculateKeywordScore(altText, 1.2); // Alt text is most important
          const descScore = calculateKeywordScore(description, 1.0);
          const shortcodeScore = calculateKeywordScore(shortcodeText, 0.9); // Shortcode itself
          const chapterScore = calculateKeywordScore(chapterName, 0.7);
          const topicScore = calculateKeywordScore(topicName, 0.7);
          const subjectScore = calculateKeywordScore(subjectName, 0.6);

          // Combine field scores (weighted average, prioritizing higher scores)
          const fieldScores = [altScore, descScore, shortcodeScore, chapterScore, topicScore, subjectScore]
            .filter(s => s > 0)
            .sort((a, b) => b - a); // Sort descending

          if (fieldScores.length > 0) {
            // Use weighted average: top score gets more weight
            if (fieldScores.length === 1) {
              keywordScore = fieldScores[0];
            } else {
              // Top 2 scores get more weight
              const topScore = fieldScores[0];
              const secondScore = fieldScores[1] || 0;
              keywordScore = (topScore * 0.6) + (secondScore * 0.3) + 
                             (fieldScores.slice(2).reduce((sum, s) => sum + s, 0) / Math.max(fieldScores.length - 2, 1) * 0.1);
            }
          }

          // 3. Improved score combination with dynamic weighting
          let finalSimilarity = 0;
          
          if (hasEmbedding && keywordScore > 0) {
            // Both available: dynamic weighting based on confidence
            // If keyword score is very high (>0.7), give it more weight
            // If semantic score is very high (>0.6), give it more weight
            let semanticWeight = 0.6;
            let keywordWeight = 0.4;

            if (keywordScore > 0.7) {
              // Strong keyword match - increase keyword weight
              keywordWeight = 0.5;
              semanticWeight = 0.5;
            } else if (semanticScore > 0.6) {
              // Strong semantic match - keep semantic priority
              semanticWeight = 0.65;
              keywordWeight = 0.35;
            }

            finalSimilarity = (semanticScore * semanticWeight) + (keywordScore * keywordWeight);
            
            // Boost when both agree (consensus boost)
            if (semanticScore > 0.4 && keywordScore > 0.5) {
              const consensusBoost = (semanticScore + keywordScore) / 2;
              finalSimilarity = Math.max(finalSimilarity, consensusBoost * 1.1); // 10% boost
            }
          } else if (hasEmbedding) {
            // Only semantic available
            finalSimilarity = semanticScore;
          } else if (keywordScore > 0) {
            // Only keyword available
            finalSimilarity = keywordScore;
          }

          // 4. Additional boosting factors
          // Boost if category matches query intent
          if (category !== 'all' && metadata.category === category) {
            finalSimilarity *= 1.05; // 5% boost for category match
          }

          // Boost exact shortcode matches (rare but very relevant)
          if (shortcodeText.includes(queryLower.replace(/\s+/g, '_'))) {
            finalSimilarity = Math.max(finalSimilarity, 0.85);
          }

          // Cap at 1.0
          finalSimilarity = Math.min(finalSimilarity, 1.0);

          // Include if similarity meets threshold
          if (finalSimilarity >= minSimilarity) {
            scored.push({
              shortcode,
              metadata,
              score: finalSimilarity
            });
          }
        }

        console.log(`[getImageShortcodes] Hybrid search results: Checked ${checkedCount} shortcodes, ${withEmbeddings} had embeddings, ${scored.length} above threshold (${minSimilarity})`);
        if (scored.length > 0) {
          console.log(`[getImageShortcodes] Top 3 results:`, scored.slice(0, 3).map(s => ({ shortcode: s.shortcode, score: s.score.toFixed(2) })));
        }

        // 3. Sort by similarity (highest first)
        scored.sort((a, b) => b.score - a.score);

        // 4. Apply limit
        const results = scored.slice(0, Math.min(limit, 20)).map(({ shortcode, metadata, score }) => ({
          shortcode,
          path: metadata.path,
          alt: metadata.alt,
          category: metadata.category,
          description: metadata.description || 'No description',
          chapterName: metadata.chapterName,
          topicName: metadata.topicName,
          similarity: Math.round(score * 100) / 100 // Round to 2 decimals
        }));

        const response = {
          found: true,
          total: scored.length,
          returned: results.length,
          shortcodes: results,
          query: query,
          category: category,
          usage: "Use these shortcodes in your response like: [image:shortcode_name]",
          instruction: "ALWAYS include at least one of these shortcodes in your response. The hybrid search (semantic + keyword) provides high accuracy, so these results are relevant. Use the highest similarity score first, but you can include multiple if they add value."
        };
        
        console.log(`[getImageShortcodes] ✅ Found ${results.length} images. Top result: ${results[0]?.shortcode || 'none'}`);
        return response;
      } catch (error: any) {
        console.error("[getImageShortcodes] Error:", error);
        return {
          found: false,
          error: error.message || "Unknown error occurred",
          shortcodes: []
        };
      }
    },
  }),
};
