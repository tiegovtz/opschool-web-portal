import { readFile } from "fs/promises";
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

    // Get auth token from cookie or header
    const authToken = getCookie(event, "signInAccessToken") ||
                      event.headers.get("authorization")?.replace("Bearer ", "").trim() ||
                      undefined;

    // Check if shortcode already exists in API
    const { getFigureByShortcode, createFigure } = await import('../utils/figuresApi');
    const existing = await getFigureByShortcode(shortcode, authToken);
    
    if (existing) {
      throw createError({
        statusCode: 409,
        message: `Shortcode "${shortcode}" already exists. Use a different figure number or delete the existing entry first.`,
      });
    }

    // Get page_number from figure-metadata.json if available
    let pageNumber: number | undefined = undefined;
    try {
      const dataDir = join(process.cwd(), "server", "data");
      const figureMetadataPath = join(dataDir, "figure-metadata.json");
      const metadataContent = await readFile(figureMetadataPath, "utf-8");
      const figureMetadata = JSON.parse(metadataContent);
      const metadataEntry = figureMetadata.images?.find((img: any) => img.shortcode === shortcode);
      if (metadataEntry) {
        pageNumber = metadataEntry.page_number;
      }
    } catch {
      // figure-metadata.json not found or invalid, that's okay
    }

    // Create figure in API
    console.log(`[image-shortcode-add] Creating figure ${shortcode} in API...`);
    const createdFigure = await createFigure({
      shortcode: shortcode,
      alt: body.alt || (body.type === "multi" ? body.alts.join(" ") : ""),
      description: body.description || body.alt || "No description available",
      category: body.category,
      subjectName: body.subjectName || "",
      chapterName: body.chapterName || "",
      topicName: body.topicName || "",
      figureNumber: body.figureNumber,
      path: body.type === "single" ? body.path : undefined,
      paths: body.type === "multi" ? body.paths : undefined,
      alts: body.type === "multi" ? body.alts : undefined,
      page_number: pageNumber,
    }, authToken);

    if (!createdFigure) {
      throw createError({
        statusCode: 500,
        message: "Failed to create figure in API",
      });
    }

    console.log(`[image-shortcode-add] ✅ Successfully created figure ${shortcode} in API`);

    // Build response entry
    const newEntry: Record<string, any> = {
      alt: createdFigure.alt,
      category: createdFigure.category,
      description: createdFigure.description,
      chapterName: createdFigure.chapterName,
      topicName: createdFigure.topicName,
      subjectName: createdFigure.subjectName,
    };

    if (createdFigure.paths && createdFigure.paths.length > 0) {
      newEntry.paths = createdFigure.paths;
      newEntry.alts = createdFigure.alts;
    } else if (createdFigure.path) {
      newEntry.path = createdFigure.path;
    }

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

