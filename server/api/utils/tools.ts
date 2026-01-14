import { tool } from "ai";
import { z } from "zod";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Syllabus } from "~/types/syllabus.interface";

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
};
