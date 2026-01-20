import { readFile, writeFile, open } from "fs/promises";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface SingleImageInput {
  type: "single";
  path: string;
  alt: string;
  category: string;
  description: string;
  chapterName: string;
  topicName: string;
  subjectName: string;
  figureNumber: string;
}

interface MultiImageInput {
  type: "multi";
  paths: string[];
  alts: string[];
  alt: string; // Combined alt text
  category: string;
  description: string;
  chapterName: string;
  topicName: string;
  subjectName: string;
  figureNumber: string;
}

type ImageInput = SingleImageInput | MultiImageInput;

/**
 * Generate shortcode from subject, level and figure number
 * e.g., "Biology Form 1" + "1.6" -> "biology_form1_figure_1_6"
 * e.g., "Physics Form 2" + "2.3" -> "physics_form2_figure_2_3"
 */
const generateShortcode = (subjectName: string, figureNumber: string): string => {
  // Extract subject and level from subjectName (e.g., "Biology Form 1" -> "biology", "form1")
  const parts = subjectName?.toLowerCase().split(" ") || [];
  const subject = parts[0]?.replace(/[^a-z]/g, "") || "general";
  
  // Extract level: "form 1" -> "form1", "Form 2" -> "form2"
  let level = "";
  const formIndex = parts.findIndex(p => p === "form");
  if (formIndex !== -1 && parts[formIndex + 1]) {
    level = `form${parts[formIndex + 1].replace(/[^0-9]/g, "")}`;
  }
  
  // Convert figure number like "1.6" to "1_6"
  const normalizedFigure = figureNumber.replace(/\./g, "_");
  
  // Build shortcode: biology_form1_figure_1_6
  const prefix = level ? `${subject}_${level}` : subject;
  return `${prefix}_figure_${normalizedFigure}`;
};

/**
 * Generate searchable text for the image
 */
const generateSearchableText = (
  shortcode: string,
  figureNumber: string,
  alt: string,
  description: string,
  chapterName: string,
  topicName: string
): string => {
  return `${shortcode} Figure ${figureNumber} ${alt} ${description} ${chapterName} ${topicName}`.trim();
};

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const body = await readBody<ImageInput>(event);

    // Validate required fields
    if (!body.figureNumber) {
      throw createError({
        statusCode: 400,
        message: "Figure number is required",
      });
    }

    // Auto-infer category from subjectName if not provided
    if (!body.category && body.subjectName) {
      const subjectLower = body.subjectName.toLowerCase().split(' ')[0];
      const categoryMap: Record<string, string> = {
        'biology': 'biology',
        'physics': 'physics',
        'chemistry': 'chemistry',
        'mathematics': 'mathematics',
        'math': 'mathematics',
        'maths': 'mathematics',
        'geography': 'geography',
        'horticulture': 'horticulture',
        'english': 'english',
        'leather': 'leather-goods',
      };
      body.category = categoryMap[subjectLower] || 'biology';
    }

    if (!body.category) {
      throw createError({
        statusCode: 400,
        message: "Category is required (or select a subject to auto-set)",
      });
    }

    if (!body.alt && body.type !== "multi") {
      throw createError({
        statusCode: 400,
        message: "Alt text is required",
      });
    }

    // Validate based on type
    if (body.type === "single") {
      if (!body.path) {
        throw createError({
          statusCode: 400,
          message: "Image URL is required for single image",
        });
      }
    } else if (body.type === "multi") {
      if (!body.paths || body.paths.length === 0) {
        throw createError({
          statusCode: 400,
          message: "At least one image URL is required for multi-image",
        });
      }
      if (!body.alts || body.alts.length !== body.paths.length) {
        throw createError({
          statusCode: 400,
          message: "Alt texts must match the number of image URLs",
        });
      }
    } else {
      throw createError({
        statusCode: 400,
        message: "Invalid image type. Use 'single' or 'multi'.",
      });
    }

    // Generate shortcode using subject name
    const shortcode = generateShortcode(body.subjectName || "", body.figureNumber);

    // Read existing shortcodes file
    const dataDir = join(process.cwd(), "server", "data");
    const filePath = join(dataDir, "image-shortcodes.json");

    let existingData: {
      generatedAt: string;
      total: number;
      byCategory: Record<string, number>;
      shortcodes: Record<string, any>;
    };

    try {
      const content = await readFile(filePath, "utf-8");
      existingData = JSON.parse(content);
    } catch {
      // File doesn't exist, create new structure
      existingData = {
        generatedAt: new Date().toISOString(),
        total: 0,
        byCategory: {
          biology: 0,
          physics: 0,
          chemistry: 0,
          mathematics: 0,
          geography: 0,
          horticulture: 0,
          english: 0,
          "leather-goods": 0,
        },
        shortcodes: {},
      };
    }

    // Check if shortcode already exists
    if (existingData.shortcodes[shortcode]) {
      throw createError({
        statusCode: 409,
        message: `Shortcode "${shortcode}" already exists. Use a different figure number or delete the existing entry first.`,
      });
    }

    // Create the new entry
    const searchableText = generateSearchableText(
      shortcode,
      body.figureNumber,
      body.alt || (body.type === "multi" ? body.alts.join(" ") : ""),
      body.description || "",
      body.chapterName || "",
      body.topicName || ""
    );

    let newEntry: Record<string, any>;

    if (body.type === "single") {
      newEntry = {
        path: body.path,
        alt: body.alt,
        category: body.category,
        description: body.description || "",
        chapterName: body.chapterName || "",
        topicName: body.topicName || "",
        subjectName: body.subjectName || "",
        searchableText,
      };
    } else {
      newEntry = {
        paths: body.paths,
        alts: body.alts,
        alt: body.alt || body.alts.join(" "),
        category: body.category,
        description: body.description || "",
        chapterName: body.chapterName || "",
        topicName: body.topicName || "",
        subjectName: body.subjectName || "",
        searchableText,
      };
    }

    // Add the new entry
    existingData.shortcodes[shortcode] = newEntry;

    // Update counts
    existingData.total = Object.keys(existingData.shortcodes).length;
    existingData.generatedAt = new Date().toISOString();

    // Recalculate category counts
    const categoryCounts: Record<string, number> = {
      biology: 0,
      physics: 0,
      chemistry: 0,
      mathematics: 0,
      geography: 0,
      horticulture: 0,
      english: 0,
      "leather-goods": 0,
    };

    for (const entry of Object.values(existingData.shortcodes)) {
      const cat = (entry as any).category || "biology";
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      }
    }
    existingData.byCategory = categoryCounts;

    // Prepare figure-metadata entry BEFORE writing anything
    const figureMetadataPath = join(dataDir, "figure-metadata.json");
    let figureMetadata: { images: any[] };

    try {
      const metadataContent = await readFile(figureMetadataPath, "utf-8");
      figureMetadata = JSON.parse(metadataContent);
    } catch {
      // File doesn't exist, create new structure
      figureMetadata = { images: [] };
    }

    const figureEntry = {
      chapter: body.chapterName || "",
      topic: body.topicName || "",
      figure_number: `Figure ${body.figureNumber}`,
      caption: body.alt || (body.type === "multi" ? body.alts.join(" ") : ""),
      description: body.description || "",
      shortcode: shortcode,
      subject: body.subjectName || "",
    };

    figureMetadata.images.push(figureEntry);

    // Prepare both JSON strings before writing
    const shortcodesJson = JSON.stringify(existingData, null, 2);
    const metadataJson = JSON.stringify(figureMetadata, null, 2);

    // Use SYNCHRONOUS writes to ensure data is flushed to disk immediately
    // This bypasses potential Nuxt dev server caching issues
    console.log(`[image-shortcode-add] Writing shortcode ${shortcode} to image-shortcodes.json (sync)...`);
    try {
      writeFileSync(filePath, shortcodesJson, "utf-8");
      console.log(`[image-shortcode-add] ✅ Successfully wrote to image-shortcodes.json`);
    } catch (writeErr) {
      console.error(`[image-shortcode-add] ❌ FAILED to write image-shortcodes.json:`, writeErr);
      throw createError({
        statusCode: 500,
        message: `Failed to write image-shortcodes.json: ${(writeErr as Error).message}`,
      });
    }

    // Then figure-metadata.json
    console.log(`[image-shortcode-add] Writing to figure-metadata.json (sync)...`);
    try {
      writeFileSync(figureMetadataPath, metadataJson, "utf-8");
      console.log(`[image-shortcode-add] ✅ Successfully wrote to figure-metadata.json`);
    } catch (writeErr) {
      console.error(`[image-shortcode-add] ❌ FAILED to write figure-metadata.json:`, writeErr);
      // Don't throw here - image-shortcodes was already written
    }

    // Verify the write by reading back SYNCHRONOUSLY
    console.log(`[image-shortcode-add] Verifying write...`);
    const verifyContent = readFileSync(filePath, "utf-8");
    const verifyData = JSON.parse(verifyContent);
    if (!verifyData.shortcodes[shortcode]) {
      console.error(`[image-shortcode-add] ❌ VERIFICATION FAILED - shortcode not found after write!`);
      console.error(`[image-shortcode-add] File has ${Object.keys(verifyData.shortcodes).length} shortcodes`);
      console.error(`[image-shortcode-add] Looking for: ${shortcode}`);
      console.error(`[image-shortcode-add] Available: ${Object.keys(verifyData.shortcodes).join(', ')}`);
      throw createError({
        statusCode: 500,
        message: "Write verification failed - shortcode not found in file after write",
      });
    }
    console.log(`[image-shortcode-add] ✅ Verified shortcode ${shortcode} exists in file (total: ${verifyData.total})`);

    return {
      success: true,
      message: `Image added successfully with shortcode: ${shortcode}`,
      shortcode,
      entry: newEntry,
    };
  } catch (error: any) {
    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error;
    }

    console.error("[image-shortcode-add] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to add image",
    });
  }
});

