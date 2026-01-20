import { tool } from "ai";
import { z } from "zod";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Syllabus } from "~/types/syllabus.interface";
import { embedQuery } from "./embeddings";

/**
 * Get available subjects from syllabus files
 */
async function getAvailableSubjects(): Promise<{ subjects: string[]; subjectLevels: Record<string, string[]> }> {
  try {
    const syllabusDir = join(process.cwd(), "server", "data", "syllabus");
    const files = await readdir(syllabusDir);
    const subjects = new Set<string>();
    const subjectLevels: Record<string, string[]> = {};
    
    files.forEach(file => {
      const match = file.match(/syllabus_(\w+)_form(\d+)\.json/);
      if (match) {
        const subject = match[1];
        const formNum = match[2];
        const level = formNum === "1" ? "Form I" : formNum === "2" ? "Form II" : `Form ${formNum}`;
        
        subjects.add(subject);
        if (!subjectLevels[subject]) {
          subjectLevels[subject] = [];
        }
        if (!subjectLevels[subject].includes(level)) {
          subjectLevels[subject].push(level);
        }
      }
    });
    
    return {
      subjects: Array.from(subjects).sort(),
      subjectLevels
    };
  } catch (error: any) {
    console.warn(`[getAvailableSubjects] Error: ${error.message}`);
    // Fallback to known subjects
    return {
      subjects: ["biology", "physics", "chemistry", "mathematics", "geography"],
      subjectLevels: {
        biology: ["Form I", "Form II"],
        physics: ["Form I", "Form II"],
        chemistry: ["Form I", "Form II"],
        mathematics: ["Form I", "Form II"],
        geography: ["Form I", "Form II"]
      }
    };
  }
}

/**
 * Format available subjects for display
 */
async function formatAvailableSubjects(): Promise<string> {
  const { subjects, subjectLevels } = await getAvailableSubjects();
  const formatted = subjects.map(subject => {
    const levels = subjectLevels[subject] || [];
    return `${subject} (${levels.join(", ")})`;
  }).join(", ");
  return formatted || "biology, physics, chemistry, mathematics, geography";
}

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
      const rawData = JSON.parse(fileContent);
      
      // Handle different JSON structures
      let syllabus: Syllabus | null = null;
      
      // NEW MERGED FORMAT: syllabus_metadata + book_metadata + competences + chapters
      if (rawData.syllabus_metadata && rawData.competences && rawData.chapters) {
        syllabus = {
          syllabus_title: rawData.syllabus_metadata.title || "Syllabus",
          level: rawData.syllabus_metadata.level || level,
          content: rawData.competences || []
        };
        // Store additional data
        (syllabus as any).chapters = rawData.chapters;
        (syllabus as any).book_metadata = rawData.book_metadata;
        (syllabus as any).syllabus_metadata = rawData.syllabus_metadata;
        (syllabus as any).isMergedFormat = true;
        console.log(`[getSyllabus] ✅ Successfully loaded syllabus (merged format): ${syllabus.syllabus_title}`);
        console.log(`[getSyllabus] ✅ Competences: ${rawData.competences?.length || 0}, Chapters: ${rawData.chapters?.length || 0}`);
      }
      // Legacy format: syllabus_title, level, content
      else if (rawData.syllabus_title && rawData.level && rawData.content) {
        syllabus = rawData as Syllabus;
        console.log(`[getSyllabus] ✅ Successfully loaded syllabus (standard format): ${syllabus.syllabus_title}`);
      } 
      // Legacy format: book_metadata/book_info + chapters only
      else if ((rawData.book_metadata || rawData.book_info) && rawData.chapters) {
        const bookInfo = rawData.book_metadata || rawData.book_info;
        syllabus = {
          syllabus_title: bookInfo.title || "Syllabus",
          level: bookInfo.level || level,
          content: []
        };
        (syllabus as any).chapters = rawData.chapters;
        (syllabus as any).isChapterOnly = true;
        console.log(`[getSyllabus] ✅ Successfully loaded syllabus (chapter-only format): ${syllabus.syllabus_title}`);
      } 
      else {
        console.error(`[getSyllabus] ❌ Unknown file format.`);
        return null;
      }
      
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
  // Get chapter figures using chapter/topic filtering (PRIMARY METHOD - NO SEARCH ALGORITHM)
  getChapterFigures: tool({
    description: "MANDATORY: Get all available image figures for a specific chapter and optional topic. You MUST call this tool whenever you are teaching a chapter or topic from the syllabus. This is the ONLY method to get images - there is no search algorithm. CRITICAL: When the user asks about a specific topic or concept (e.g., 'Light', 'Photosynthesis', 'Force'), you MUST extract the topic name from the user's message or syllabus and pass it as the 'topic' parameter. The tool searches both topic names AND figure captions, so you can use concept names directly (e.g., if user asks about 'Light', pass topic: 'Light' and it will find figures with 'Light' in their caption even if the topic is different). Provide the chapter name exactly as it appears in the syllabus (e.g., 'Chapter Six: Nutrition in plants', 'Chapter One: Introduction to Biology') and the topic/concept name if the user is asking about a specific topic. You will receive all figures available for that chapter/topic. Returns a list of figures with their shortcodes that you MUST use with [image:shortcode] format in your response. All returned figures are guaranteed to be relevant because they're filtered by the exact chapter/topic you're teaching. Review all returned figures - if they are all highly relevant, use multiple [image:shortcode] in your response. If figures are returned, you MUST include at least one [image:shortcode] in your response.",
    inputSchema: z.object({
      chapter: z.string().describe("Chapter name using WORD form for numbers (e.g., 'Chapter One', 'Chapter Two', 'Chapter Six') NOT digits. Format: 'Chapter [WORD]: [Title]' (e.g., 'Chapter One: Introduction to Biology', 'Chapter Six: Nutrition in plants'). If syllabus shows chapter_number: 1, use 'Chapter One: [Title]' not 'Chapter 1: [Title]'. Must match exactly as in figure-metadata.json."),
      topic: z.string().optional().describe("EXACT topic name from the user's message or syllabus. Extract the specific topic the user is asking about. Examples: 'Basic concepts and terminologies in Biology', 'Importance of studying Biology', 'The process of photosynthesis'. The topic name must match exactly as it appears in the syllabus. If the user mentions a specific topic, you MUST extract it and provide it here. If provided, only returns figures for this specific topic. DO NOT use 'all' - either provide the exact topic name or omit this parameter entirely."),
    }),
    execute: async ({ chapter, topic }) => {
      try {
        console.log(`[getChapterFigures] 🔍 TOOL CALLED - chapter: "${chapter}", topic: "${topic || 'all'}"`);
        
        // Load figure-metadata.json
        const filePath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
        let fileContent: string;
        try {
          fileContent = await readFile(filePath, 'utf-8');
        } catch (fileError: any) {
          console.error("[getChapterFigures] Failed to load figure-metadata.json:", fileError);
          return {
            found: false,
            error: "Figure metadata file not available",
            figures: []
          };
        }
        
        const data = JSON.parse(fileContent);
        const images = data.images || [];
        
        if (images.length === 0) {
          return {
            found: false,
            message: "No figure metadata available",
            figures: []
          };
        }
        
        // Normalize chapter/topic for comparison
        const normalizeChapter = (ch: string) => ch.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizeTopic = (t: string) => t.toLowerCase().trim().replace(/\s+/g, ' ');
        
        const queryChapter = normalizeChapter(chapter);
        
        // Filter by chapter - try exact match first
        let filtered = images.filter((img: any) => {
          const imgChapter = normalizeChapter(img.chapter || '');
          return imgChapter === queryChapter;
        });
        
        // If no exact match found, try flexible matching by chapter number
        if (filtered.length === 0) {
          const chapterNumMatch = chapter.match(/chapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)/i);
          if (chapterNumMatch) {
            const numberStr = chapterNumMatch[1].toLowerCase();
            const wordToDigit: Record<string, string> = {
              'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
              'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
            };
            const digitToWord: Record<string, string> = {
              '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
              '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
            };
            const wordToWord: Record<string, string> = {
              'one': 'one', 'two': 'two', 'three': 'three', 'four': 'four', 'five': 'five',
              'six': 'six', 'seven': 'seven', 'eight': 'eight', 'nine': 'nine', 'ten': 'ten'
            };
            
            // Determine if input is word or digit form
            const isDigit = /^\d+$/.test(numberStr);
            const chapterWord = isDigit ? digitToWord[numberStr] : wordToWord[numberStr] || null;
            const chapterDigit = isDigit ? numberStr : wordToDigit[numberStr] || numberStr;
            
            // Try matching by chapter number (both word and digit form)
            filtered = images.filter((img: any) => {
              const imgChapter = normalizeChapter(img.chapter || '');
              
              // Match both word and digit forms regardless of input format
              // If input is "Chapter 1", try matching "chapter 1:" and "chapter one:"
              // If input is "Chapter One", try matching "chapter one:" and "chapter 1:"
                if (imgChapter.startsWith(`chapter ${chapterWord}:`) || 
                    imgChapter.startsWith(`chapter ${chapterDigit}:`)) {
                  return true;
                }
              
              return false;
            });
            
            if (filtered.length > 0) {
              console.log(`[getChapterFigures] ✅ Matched "${chapter}" to chapter by number - found ${filtered.length} figures in "${filtered[0].chapter}"`);
            }
          }
        }
        
        // If still no match, log available chapters for debugging
        if (filtered.length === 0) {
          const availableChapters = [...new Set(images.map((img: any) => img.chapter).filter(Boolean))].slice(0, 5);
          console.log(`[getChapterFigures] ⚠️  No match found for chapter "${chapter}"`);
          console.log(`[getChapterFigures] Available chapters (sample): ${availableChapters.join(', ')}`);
        }
        
        // Filter by topic if provided (improved matching: exact first, then flexible for syllabus differences)
        // Ignore invalid topic values like "all"
        if (topic && topic.trim() && topic.trim().toLowerCase() !== 'all') {
          const queryTopic = normalizeTopic(topic);
          const queryWords = queryTopic.split(/\s+/).filter(w => w.length > 2);
          const isSingleWord = queryWords.length === 1;
          
          // First, try exact match
          let exactMatches = filtered.filter((img: any) => {
            const imgTopic = normalizeTopic(img.topic || '');
            return imgTopic === queryTopic;
          });
          
          // If exact matches found, use only those (unless it's a single-word query from syllabus)
          if (exactMatches.length > 0 && !isSingleWord) {
            filtered = exactMatches;
            console.log(`[getChapterFigures] ✅ Using exact topic match: ${filtered.length} figures`);
          } else {
            // For single-word queries or when no exact match, use flexible matching
            // Check both topic AND caption for better matching
            filtered = filtered.filter((img: any) => {
              const imgTopic = normalizeTopic(img.topic || '');
              const imgCaption = normalizeTopic(img.caption || '');
              
              // Exact match (highest priority) - check topic first
              if (imgTopic === queryTopic) return true;
              
              // For single-word queries (e.g., "photosynthesis", "light" from user query)
              if (isSingleWord) {
                // Match topics containing that word (broad match for syllabus topic names)
                if (imgTopic.includes(queryWords[0])) return true;
                
                // Also check caption for single-word queries (e.g., "Light" in caption)
                if (imgCaption.includes(queryWords[0])) return true;
                
                return false;
              }
              
              // For multi-word queries, be more precise
              // Check if the query phrase is contained in the topic
              if (imgTopic.includes(queryTopic)) {
                return true;
              }
              
              // Also check caption for multi-word queries (fallback when topic doesn't match)
              if (imgCaption.includes(queryTopic)) {
                return true;
              }
              
              return false;
            });
            
            if (filtered.length > 0 && !isSingleWord) {
              console.log(`[getChapterFigures] ✅ Using flexible topic/caption match: ${filtered.length} figures`);
            } else if (filtered.length > 0 && isSingleWord) {
              console.log(`[getChapterFigures] ✅ Using flexible topic/caption match (single-word): ${filtered.length} figures`);
            }
          }
        }
        
        // Map to return format - include description so AI can understand what the image shows
        const figures = filtered.map((img: any) => ({
          figure_number: img.figure_number || '',
          caption: img.caption || '',
          description: img.description || '',  // Rich description of what the image shows
          shortcode: img.shortcode || '',
          page_number: img.page_number || null,
          chapter: img.chapter || '',
          topic: img.topic || ''
        }));
        
        console.log(`[getChapterFigures] ✅ Found ${figures.length} figures for chapter "${chapter}"${topic ? `, topic "${topic}"` : ''}`);
        
        if (figures.length === 0) {
          return {
            found: false,
            message: `No figures found for chapter "${chapter}"${topic ? `, topic "${topic}"` : ''}`,
            figures: []
          };
        }
        
        return {
          found: true,
          total: figures.length,
          chapter: chapter,
          topic: topic || null,
          figures: figures,
          usage: "CRITICAL: You MUST include at least one [image:shortcode] in your response text. Use these shortcodes like: [image:shortcode_name]. Example: 'As shown in this diagram: [image:biology_form1_figure_2_1], the hand lens is used for...'. If multiple figures are returned and they are all highly relevant to what you're teaching, you SHOULD use multiple [image:shortcode] in your response - don't limit yourself to just one if all figures are relevant. Do not just acknowledge this result - you MUST use the shortcode(s) in your actual response.",
          instruction: "MANDATORY: Review ALL returned figures. You MUST include at least one [image:shortcode] from the figures list in your response. If multiple figures are returned and they are all highly relevant to the topic you're teaching, use multiple [image:shortcode] - one for each relevant figure. Select which figures to use based on relevance: if they are all highly relevant, use them all. Use the shortcodes with [image:shortcode] format when referencing these figures. Example: 'Look at this: [image:biology_form1_figure_1_1] shows living things.' This is not optional - if figures are returned, you MUST use at least one, and you SHOULD use multiple if they are all relevant."
        };
      } catch (error: any) {
        console.error("[getChapterFigures] Error:", error);
        return {
          found: false,
          error: error.message || "Unknown error occurred",
          figures: []
        };
      }
    },
  }),

  // Get syllabus for a subject and level from JSON files
  getSyllabus: tool({
    description: "Get the syllabus/curriculum for a given subject and level (Form I or Form II) from JSON files. Use this when you need to understand what competences, topics, or content should be covered for a specific subject and level. This helps ensure syllabus compliance and proper lesson planning. Available subjects include: biology, physics, chemistry, mathematics, geography. Available levels: Form I, Form II.",
    inputSchema: z.object({ 
      subject: z.string().describe("The subject name (e.g., 'biology', 'physics', 'mathematics', 'chemistry', 'geography', 'history', 'english', 'kiswahili')"),
      level: z.string().describe("The education level (e.g., 'Form I', 'Form II', 'form i', 'form ii')")
    }),
    execute: async ({ subject, level }) => {
      try {
        console.log(`[getSyllabus] Requested: subject=${subject}, level=${level}`);
        const syllabus = await readSyllabusFromFile(subject, level);
        
        if (!syllabus) {
          const availableSubjects = await formatAvailableSubjects();
          return {
            subject,
            level,
            syllabus: `No syllabus file found for ${subject} ${level}. Available files: ${availableSubjects}. You may need to rely on general knowledge of the Tanzanian curriculum for other subjects.`,
            found: false,
            competences: []
          };
        }

        // Format syllabus for the agent
        let formattedSyllabus: string;
        let competences: any[] = [];
        let chapters: any[] = [];
        let totalCompetences = 0;
        
        // Check format type
        const isMergedFormat = (syllabus as any).isMergedFormat === true;
        const isChapterOnly = (syllabus as any).isChapterOnly === true;
        
        // MERGED FORMAT: Has both competences AND chapters
        if (isMergedFormat && syllabus.content && syllabus.content.length > 0) {
          const syllabusMetadata = (syllabus as any).syllabus_metadata || {};
          const rawChapters = (syllabus as any).chapters || [];
          
          formattedSyllabus = `SYLLABUS: ${syllabus.syllabus_title}\n`;
          formattedSyllabus += `LEVEL: ${syllabus.level}\n`;
          formattedSyllabus += `TOTAL PERIODS: ${syllabusMetadata.total_periods || 'N/A'}\n\n`;
          formattedSyllabus += "=".repeat(80) + "\n\n";
          
          // Format chapters for quick reference
          formattedSyllabus += "CHAPTERS (Book Structure):\n";
          rawChapters.forEach((ch: any) => {
            formattedSyllabus += `  Chapter ${ch.chapter_number}: ${ch.title}\n`;
            if (ch.sections) {
              ch.sections.slice(0, 3).forEach((sec: any) => {
                formattedSyllabus += `    - ${sec.title}\n`;
              });
              if (ch.sections.length > 3) {
                formattedSyllabus += `    ... and ${ch.sections.length - 3} more sections\n`;
              }
            }
          });
          formattedSyllabus += "\n" + "=".repeat(80) + "\n\n";
          
          // Format competences with teaching methods
          formattedSyllabus += "COMPETENCES (Curriculum Requirements):\n\n";
          syllabus.content.forEach((competence: any, index: number) => {
            formattedSyllabus += `COMPETENCE ${index + 1}:\n`;
            formattedSyllabus += `  Main: ${competence.main_competence}\n`;
            formattedSyllabus += `  Specific: ${competence.specific_competence}\n`;
            formattedSyllabus += `  Periods: ${competence.number_of_periods}\n\n`;
            
            formattedSyllabus += "  Learning Activities:\n";
            competence.learning_activities?.forEach((activity: any, actIdx: number) => {
              formattedSyllabus += `    ${actIdx + 1}. ${activity.activity}\n`;
              formattedSyllabus += `       Related Chapters: ${activity.related_chapters?.join(', ') || 'N/A'}\n`;
              formattedSyllabus += `       Teaching Methods:\n`;
              activity.teaching_learning_methods?.forEach((method: string) => {
                formattedSyllabus += `         • ${method}\n`;
              });
              formattedSyllabus += `       Assessment: ${activity.assessment_criteria}\n`;
              formattedSyllabus += `       Resources: ${activity.suggested_resources}\n\n`;
            });
            formattedSyllabus += "-".repeat(80) + "\n\n";
          });
          
          // Build competences array with full details
          competences = syllabus.content.map((c: any) => ({
            main_competence: c.main_competence,
            specific_competence: c.specific_competence,
            periods: c.number_of_periods,
            learning_activities: c.learning_activities?.map((a: any) => ({
              activity: a.activity,
              related_chapters: a.related_chapters,
              teaching_methods: a.teaching_learning_methods,
              assessment_criteria: a.assessment_criteria,
              suggested_resources: a.suggested_resources
            })) || []
          }));
          
          // Build chapters array
          chapters = rawChapters.map((ch: any) => ({
            chapter_number: ch.chapter_number,
            title: ch.title,
            sections: ch.sections?.map((s: any) => s.title) || []
          }));
          
          totalCompetences = syllabus.content.length;
          
        } else if (isChapterOnly && (syllabus as any).chapters) {
          // Chapter-only format
          const rawChapters = (syllabus as any).chapters;
          formattedSyllabus = `SYLLABUS: ${syllabus.syllabus_title}\n`;
          formattedSyllabus += `LEVEL: ${syllabus.level}\n\n`;
          formattedSyllabus += "NOTE: This syllabus uses chapter-based structure only.\n\n";
          formattedSyllabus += `TOTAL CHAPTERS: ${rawChapters.length}\n\n`;
          
          rawChapters.forEach((chapter: any) => {
            formattedSyllabus += `CHAPTER ${chapter.chapter_number}: ${chapter.title}\n`;
            if (chapter.sections) {
              chapter.sections.forEach((sec: any, idx: number) => {
                formattedSyllabus += `  ${idx + 1}. ${sec.title}\n`;
              });
            }
            formattedSyllabus += "\n";
          });
          
          chapters = rawChapters.map((ch: any) => ({
            chapter_number: ch.chapter_number,
            title: ch.title,
            sections: ch.sections?.map((s: any) => s.title) || []
          }));
          totalCompetences = rawChapters.length;
          
        } else if (syllabus.content && syllabus.content.length > 0) {
          // Legacy competence-only format
          formattedSyllabus = formatSyllabusForAgent(syllabus);
          competences = syllabus.content.map((c) => ({
            main_competence: c.main_competence,
            specific_competence: c.specific_competence,
            periods: c.number_of_periods,
            activities_count: c.learning_activities.length
          }));
          totalCompetences = syllabus.content.length;
        } else {
          formattedSyllabus = `SYLLABUS: ${syllabus.syllabus_title}\nLEVEL: ${syllabus.level}\n\nNo content found.`;
        }
        
        return {
          subject: syllabus.syllabus_title.includes(subject.toLowerCase()) ? subject : syllabus.syllabus_title,
          level: syllabus.level,
          syllabus: formattedSyllabus,
          competences: competences,
          chapters: chapters,
          totalCompetences: totalCompetences,
          totalChapters: chapters.length,
          found: true,
          instruction: "USE the teaching_methods from the competences to guide how you teach. CHECK understanding using the assessment_criteria. FOLLOW the chapters sequentially when teaching."
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

  // REMOVED: getImageShortcodes tool - no search algorithm, use getChapterFigures for direct topic-based access instead
};
