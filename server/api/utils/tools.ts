import { tool } from "ai";
import { z } from "zod";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import type { Syllabus } from "~/types/syllabus.interface";
import { fetchCombinedRAGContext } from "../../utils/rag";

let currentAuthToken: string | undefined = undefined;

export function setAuthTokenForTools(token: string | undefined): void {
  currentAuthToken = token;
}

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
        const level = `Form ${formNum}`;
        
        subjects.add(subject as string);
        if (!subjectLevels[subject as string]) {
          subjectLevels[subject as string] = [];
        }
        if (!subjectLevels[subject as string]?.includes(level)) {
          subjectLevels[subject as string]?.push(level);
        }
      }
    });
    
    return {
      subjects: Array.from(subjects).sort(),
      subjectLevels
    };
  } catch {
    return {
      subjects: ["biology", "physics", "chemistry", "mathematics", "geography"],
      subjectLevels: {
        biology: ["Form 1", "Form 2"],
        physics: ["Form 1", "Form 2"],
        chemistry: ["Form 1", "Form 2"],
        mathematics: ["Form 1", "Form 2"],
        geography: ["Form 1", "Form 2"]
      }
    };
  }
}

async function formatAvailableSubjects(): Promise<string> {
  const { subjects, subjectLevels } = await getAvailableSubjects();
  const formatted = subjects.map(subject => {
    const levels = subjectLevels[subject] || [];
    return `${subject} (${levels.join(", ")})`;
  }).join(", ");
  return formatted || "biology, physics, chemistry, mathematics, geography";
}

async function readSyllabusFromFile(subject: string, level: string): Promise<Syllabus | null> {
  try {
    const normalizedSubject = subject.toLowerCase().trim().replace(/\s+/g, "_");
    
    let normalizedLevel = level.toLowerCase().trim();
    normalizedLevel = normalizedLevel.replace(/form\s*1$/i, "form1");
    normalizedLevel = normalizedLevel.replace(/form\s*2$/i, "form2");
    normalizedLevel = normalizedLevel.replace(/form\s*3$/i, "form3");
    normalizedLevel = normalizedLevel.replace(/form\s*4$/i, "form4");
    normalizedLevel = normalizedLevel.replace(/\s+/g, "");
    
    const filename = `syllabus_${normalizedSubject}_${normalizedLevel}.json`;
    const syllabusDir = join(process.cwd(), "server", "data", "syllabus");
    const filePath = join(syllabusDir, filename);
    
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const rawData = JSON.parse(fileContent);
      
      let syllabus: Syllabus | null = null;
      
      if (rawData.syllabus_metadata && rawData.competences && rawData.chapters) {
        syllabus = {
          syllabus_title: rawData.syllabus_metadata.title || "Syllabus",
          level: rawData.syllabus_metadata.level || level,
          content: rawData.competences || []
        };
        (syllabus as any).chapters = rawData.chapters;
        (syllabus as any).book_metadata = rawData.book_metadata;
        (syllabus as any).syllabus_metadata = rawData.syllabus_metadata;
        (syllabus as any).isMergedFormat = true;
      }
      else if (rawData.syllabus_title && rawData.level && rawData.content) {
        syllabus = rawData as Syllabus;
      } 
      else if ((rawData.book_metadata || rawData.book_info) && rawData.chapters) {
        const bookInfo = rawData.book_metadata || rawData.book_info;
        syllabus = {
          syllabus_title: bookInfo.title || "Syllabus",
          level: bookInfo.level || level,
          content: []
        };
        (syllabus as any).chapters = rawData.chapters;
        (syllabus as any).isChapterOnly = true;
      } 
      else {
        return null;
      }
      
      return syllabus;
    } catch {
      return null;
    }
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

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export const studentTools = {
  getChapterFigures: tool({
    description: "MANDATORY: Get all available image figures for a specific chapter and optional topic. You MUST call this tool whenever you are teaching a chapter or topic from the syllabus. This is the ONLY method to get images. Provide the chapter name exactly as it appears in the syllabus (e.g., 'Chapter Six: Nutrition in plants', 'Chapter One: Introduction to Biology'). Returns a list of figures with their shortcodes that you MUST use with [image:shortcode] format in your response. If figures are returned, you MUST include at least one [image:shortcode] in your response.",
    inputSchema: z.object({
      chapter: z.string().describe("Chapter name using WORD form for numbers (e.g., 'Chapter One', 'Chapter Two', 'Chapter Six') NOT digits."),
      topic: z.string().optional().describe("EXACT topic name from the user's message or syllabus."),
      subject: z.string().optional().describe("Subject name to filter figures (e.g., 'biology', 'physics', 'chemistry')."),
    }),
    execute: async ({ chapter, topic, subject }) => {
      try {
        const extractSubjectFromChapter = (ch: string): string | null => {
          const lower = ch.toLowerCase();
          if (lower.includes('biology')) return 'biology';
          if (lower.includes('physics')) return 'physics';
          if (lower.includes('chemistry')) return 'chemistry';
          if (lower.includes('mathematics') || lower.includes('math')) return 'mathematics';
          if (lower.includes('geography')) return 'geography';
          return null;
        };
        
        const querySubject = subject?.toLowerCase() || extractSubjectFromChapter(chapter);
        
        // Check if authentication token is available
        if (!currentAuthToken || !currentAuthToken.trim()) {
          console.error('[getChapterFigures] No authentication token available');
          return {
            found: false,
            error: "Authentication required. User must be signed in to access figures.",
            figures: [],
            requiresAuth: true
          };
        }
        
        let images: any[] = [];
        try {
          const { getFigures } = await import('../../utils/figuresApi');
          
          const filterOptions: { category?: string; chapter?: string; topic?: string } = {};
          
          if (querySubject) {
            filterOptions.category = querySubject;
          }
          
          if (chapter) {
            filterOptions.chapter = chapter;
          }
          
          if (topic && topic.trim() && topic.trim().toLowerCase() !== 'all') {
            filterOptions.topic = topic;
          }
          
          console.log('[getChapterFigures] Fetching figures with options:', {
            filterOptions,
            hasToken: !!currentAuthToken,
            chapter,
            topic,
            subject: querySubject
          });
          
          let figures = await getFigures(filterOptions, currentAuthToken);
          
          if (figures.length === 0 && querySubject && (filterOptions.chapter || filterOptions.topic)) {
            console.log('[getChapterFigures] No figures with filters, trying with category only');
            figures = await getFigures({ category: querySubject }, currentAuthToken);
          }
          
          if (figures.length === 0 && querySubject) {
            console.log('[getChapterFigures] No figures with category, trying all figures');
            figures = await getFigures({}, currentAuthToken);
          }
          
          console.log('[getChapterFigures] Found figures:', figures.length);
          
          images = figures.map((fig: any) => ({
            figure_number: fig.figure_number || '',
            caption: fig.alt || '',
            description: fig.description || '',
            shortcode: fig.shortcode || '',
            page_number: fig.page_number || null,
            chapter: fig.chapterName || '',
            topic: fig.topicName || '',
            subject: fig.subjectName || '',
            path: fig.path || '',
            paths: fig.paths || [],
            category: fig.category || ''
          }));
        } catch (error: any) {
          // Log the actual error for debugging
          console.error('[getChapterFigures] Error fetching figures:', {
            error: error.message,
            stack: error.stack,
            chapter,
            topic,
            subject: querySubject,
            hasToken: !!currentAuthToken
          });
          
          // Check if it's an authentication error
          const errorMessage = error.message || String(error);
          if (errorMessage.includes('401') || 
              errorMessage.includes('authentication') || 
              errorMessage.includes('Unauthorized') ||
              errorMessage.includes('No user authentication token')) {
            return {
              found: false,
              error: "Authentication failed. Please sign in to access figures.",
              figures: [],
              requiresAuth: true
            };
          }
          
          return {
            found: false,
            error: `Figure metadata not available: ${errorMessage}`,
            figures: []
          };
        }
        
        if (images.length === 0) {
          return {
            found: false,
            message: "No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.",
            figures: []
          };
        }
        
        const normalizeChapter = (ch: string) => ch.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizeTopic = (t: string) => t.toLowerCase().trim().replace(/\s+/g, ' ');
        
        const queryChapter = normalizeChapter(chapter);
        
        let filtered = images.filter((img: any) => {
          const imgChapter = normalizeChapter(img.chapter || '');
          const matchesChapter = imgChapter === queryChapter;
          
          if (querySubject && matchesChapter) {
            const imgSubject = extractSubjectFromChapter(img.chapter || '') || 
                              (img.subject || '').toLowerCase();
            const imgShortcode = (img.shortcode || '').toLowerCase();
            
            const subjectMatch = imgSubject === querySubject || 
                                imgShortcode.startsWith(querySubject);
            return subjectMatch;
          }
          
          return matchesChapter;
        });
        
        if (filtered.length === 0) {
          const chapterNumMatch = chapter.match(/chapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)/i);
          if (chapterNumMatch && chapterNumMatch[1]) {
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
            
            const isDigit = /^\d+$/.test(numberStr);
            const chapterWord = isDigit ? digitToWord[numberStr] : wordToWord[numberStr] || null;
            const chapterDigit = isDigit ? numberStr : wordToDigit[numberStr] || numberStr;
            
            filtered = images.filter((img: any) => {
              const imgChapter = normalizeChapter(img.chapter || '');
              
              const matchesChapterNumber = imgChapter.startsWith(`chapter ${chapterWord}:`) || 
                                          imgChapter.startsWith(`chapter ${chapterDigit}:`);
              
              if (!matchesChapterNumber) return false;
              
              if (querySubject) {
                const imgSubject = extractSubjectFromChapter(img.chapter || '') || 
                                  (img.subject || '').toLowerCase();
                const imgShortcode = (img.shortcode || '').toLowerCase();
                
                const subjectMatch = imgSubject === querySubject || 
                                    imgShortcode.startsWith(querySubject);
                return subjectMatch;
              }
              
              return true;
            });
          }
        }
        
        if (topic && topic.trim() && topic.trim().toLowerCase() !== 'all') {
          const queryTopic = normalizeTopic(topic);
          const queryWords = queryTopic.split(/\s+/).filter(w => w.length > 2);
          const isSingleWord = queryWords.length === 1;
          
          let exactMatches = filtered.filter((img: any) => {
            const imgTopic = normalizeTopic(img.topic || '');
            return imgTopic === queryTopic;
          });
          
          if (exactMatches.length > 0 && !isSingleWord) {
            filtered = exactMatches;
          } else {
            filtered = filtered.filter((img: any) => {
              const imgTopic = normalizeTopic(img.topic || '');
              const imgCaption = normalizeTopic(img.caption || '');
              
              if (imgTopic === queryTopic) return true;
              
              if (isSingleWord) {
                if (imgTopic?.includes(queryWords[0] as string)) return true;
                if (imgCaption.includes(queryWords[0] as string)) return true;
                return false;
              }
              
              if (imgTopic.includes(queryTopic)) return true;
              if (imgCaption.includes(queryTopic)) return true;
              
              return false;
            });
          }
        }
        
        const figures = filtered.map((img: any) => ({
          figure_number: img.figure_number || '',
          caption: img.caption || '',
          description: img.description || '',
          shortcode: img.shortcode || '',
          page_number: img.page_number || null,
          chapter: img.chapter || '',
          topic: img.topic || ''
        }));
        
        if (figures.length === 0) {
          return {
            found: false,
            message: `No figures available. DO NOT mention images, diagrams, or visual representations in your response. Teach using text-based explanations only.`,
            figures: []
          };
        }
        
        const shortcodesToUse = figures.map((f: any) => `[image:${f.shortcode}]`);
        
        return {
          found: true,
          total: figures.length,
          chapter: chapter,
          topic: topic || null,
          figures: figures,
          shortcodes_ready_to_use: shortcodesToUse,
          usage: `CRITICAL: You MUST include at least one image in your response. Copy-paste one of these EXACTLY into your response: ${shortcodesToUse.join(' or ')}.`,
          instruction: `MANDATORY: Include at least one of these shortcodes in your response text: ${shortcodesToUse.join(', ')}.`
        };
      } catch (error: any) {
        return {
          found: false,
          error: error.message || "Unknown error occurred",
          figures: []
        };
      }
    },
  }),

  getSyllabus: tool({
    description: "Get the syllabus/curriculum for a given subject and level (Form 1 or Form 2) from JSON files. Use this when you need to understand what competences, topics, or content should be covered for a specific subject and level. Available subjects: biology, physics, chemistry, mathematics, geography. Available levels: Form 1, Form 2.",
    inputSchema: z.object({ 
      subject: z.string().describe("The subject name (e.g., 'biology', 'physics', 'mathematics', 'chemistry', 'geography')"),
      level: z.string().describe("The education level (e.g., 'Form 1', 'Form 2')")
    }),
    execute: async ({ subject, level }) => {
      try {
        const syllabus = await readSyllabusFromFile(subject, level);
        
        if (!syllabus) {
          const availableSubjects = await formatAvailableSubjects();
          return {
            subject,
            level,
            syllabus: `No syllabus file found for ${subject} ${level}. Available files: ${availableSubjects}.`,
            found: false,
            competences: []
          };
        }

        let formattedSyllabus: string;
        let competences: any[] = [];
        let chapters: any[] = [];
        let totalCompetences = 0;
        
        const isMergedFormat = (syllabus as any).isMergedFormat === true;
        const isChapterOnly = (syllabus as any).isChapterOnly === true;
        
        if (isMergedFormat && syllabus.content && syllabus.content.length > 0) {
          const syllabusMetadata = (syllabus as any).syllabus_metadata || {};
          const rawChapters = (syllabus as any).chapters || [];
          
          formattedSyllabus = `SYLLABUS: ${syllabus.syllabus_title}\n`;
          formattedSyllabus += `LEVEL: ${syllabus.level}\n`;
          formattedSyllabus += `TOTAL PERIODS: ${syllabusMetadata.total_periods || 'N/A'}\n\n`;
          formattedSyllabus += "=".repeat(80) + "\n\n";
          
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
          
          chapters = rawChapters.map((ch: any) => ({
            chapter_number: ch.chapter_number,
            title: ch.title,
            sections: ch.sections?.map((s: any) => s.title) || []
          }));
          
          totalCompetences = syllabus.content.length;
          
        } else if (isChapterOnly && (syllabus as any).chapters) {
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

  convertFahrenheitToCelsius: tool({
    description: "Convert a temperature in Fahrenheit to Celsius",
    inputSchema: z.object({ temperature: z.number() }),
    execute: async ({ temperature }) => ({
      celsius: Math.round((temperature - 32) * (5 / 9)),
    }),
  }),

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

  weather: tool({
    description: "Get the weather in a location (Fahrenheit)",
    inputSchema: z.object({ location: z.string() }),
    execute: async ({ location }) => ({
      location,
      temperature: Math.round(Math.random() * (90 - 32) + 32),
    }),
  }),

  searchTextbooks: tool({
    description: `Search uploaded textbooks for factual information about a topic. 
    
WHEN TO USE THIS TOOL:
- When a student asks a FACTUAL question about curriculum content (e.g., "What is photosynthesis?", "Explain Newton's laws")
- When you need ACCURATE information from official textbooks

WHEN NOT TO USE THIS TOOL:
- For greetings (e.g., "Hello", "Hi", "How are you?")
- For questions about yourself (e.g., "Who are you?", "What can you do?")
- For general conversation or clarification questions
- For questions about the syllabus structure (use get_syllabus instead)
- For getting images (use get_chapter_figures instead)

IMPORTANT: If this tool returns results, you MUST cite them using: "According to [Book Title] ([Citation])..."`,
    inputSchema: z.object({ 
      query: z.string().describe("The search query - be specific and include the topic/concept you need information about."),
      subject: z.string().optional().describe("Optional: The subject area (biology, physics, chemistry, mathematics, geography)"),
      level: z.string().optional().describe("Optional: The education level (Form 1, Form 2)"),
    }),
    execute: async ({ query, subject, level }) => {
      if (!query?.trim()) {
        return {
          found: false,
          message: "No search query provided",
          context: ""
        };
      }

      try {
        const queryContext = (subject || level) ? {
          subject: subject || undefined,
          level: level || undefined,
        } : undefined;

        const ragResult = await fetchCombinedRAGContext(
          query.trim(),
          currentAuthToken,
          queryContext,
          {
            useLocal: false,
            useExternal: true,
            preferExternal: true,
          }
        );

        if (!ragResult.context || ragResult.context.trim().length === 0) {
          return {
            found: false,
            query: query,
            message: "No relevant information found in uploaded textbooks. The topic may not be covered in the available materials.",
            context: "",
            instruction: "Inform the student that this information is not available in the uploaded textbooks. Suggest they check other sources or rephrase their question."
          };
        }

        let context = ragResult.context;
        const maxChars = ragResult.source === 'combined' ? 5000 : 3500;
        if (context.length > maxChars) {
          context = context.slice(0, maxChars).trimEnd() + "...";
        }

        return {
          found: true,
          query: query,
          source: ragResult.source,
          context: context,
          hasLocalResults: !!ragResult.localContext,
          hasExternalResults: !!ragResult.externalContext,
          instruction: "You MUST use the context above to answer. ALWAYS cite the source using format: 'According to [Book Title] ([Citation])...'. Do NOT use information outside this context."
        };
      } catch (error: any) {
        return {
          found: false,
          query: query,
          error: error?.message || "Search failed",
          message: "An error occurred while searching textbooks. Please try again.",
          context: ""
        };
      }
    },
  }),
};
