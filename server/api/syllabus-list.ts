import { readFile, readdir } from "fs/promises";
import { join } from "path";

interface SyllabusSection {
  title: string;
  page?: number;
}

interface SyllabusChapter {
  chapter_number: number;
  title: string;
  start_page?: number;
  sections: SyllabusSection[];
}

interface SyllabusFile {
  book_metadata: {
    title: string;
    level: string;
  };
  chapters: SyllabusChapter[];
}

interface SubjectData {
  id: string;
  name: string;
  level: string;
  chapters: Array<{
    number: number;
    title: string;
    fullTitle: string;
    topics: string[];
  }>;
}

/**
 * GET /api/syllabus-list
 * Returns all available subjects with their chapters and topics
 * for use in cascading dropdowns
 */
export default defineEventHandler(async () => {
  try {
    const syllabusDir = join(process.cwd(), "server", "data", "syllabus");

    // Read all syllabus files
    const files = await readdir(syllabusDir);
    const syllabusFiles = files.filter(
      (f) => f.startsWith("syllabus_") && f.endsWith(".json")
    );

    const subjects: SubjectData[] = [];

    for (const file of syllabusFiles) {
      try {
        const filePath = join(syllabusDir, file);
        const content = await readFile(filePath, "utf-8");
        const data: SyllabusFile = JSON.parse(content);

        // Extract subject and level from filename
        // e.g., "syllabus_biology_form1.json" -> subject: "biology", level: "form1"
        const match = file.match(/syllabus_(\w+)_(\w+)\.json/);
        if (!match) continue;

        const [, subjectKey, levelKey] = match;
        const subjectName =
          subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);
        const levelName = levelKey.replace(/(\d+)/, " $1").trim();

        // Build chapters with topics
        const chapters = data.chapters.map((chapter) => {
          // Convert chapter number to word form for chapter title
          const numberWords = [
            "",
            "One",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine",
            "Ten",
            "Eleven",
            "Twelve",
          ];
          const chapterWord =
            numberWords[chapter.chapter_number] || chapter.chapter_number;
          const fullTitle = `Chapter ${chapterWord}: ${chapter.title}`;

          return {
            number: chapter.chapter_number,
            title: chapter.title,
            fullTitle,
            topics: chapter.sections
              .filter((s) => !s.title.toLowerCase().includes("revision"))
              .map((s) => s.title),
          };
        });

        subjects.push({
          id: `${subjectKey}_${levelKey}`,
          name: `${subjectName} ${levelName}`,
          level: levelName,
          chapters,
        });
      } catch (err) {
        console.error(`[syllabus-list] Error reading ${file}:`, err);
        // Continue with other files
      }
    }

    // Sort subjects alphabetically
    subjects.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      total: subjects.length,
      subjects,
    };
  } catch (error: any) {
    console.error("[syllabus-list] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to load syllabus data",
    });
  }
});

