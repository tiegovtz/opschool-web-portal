import { readFile } from "fs/promises";
import { join } from "path";
import { getCookie } from "h3";

interface UpdateImageInput {
  shortcode: string;  // The shortcode to update
  path?: string;      // New single image URL
  paths?: string[];   // New multi-image URLs
  alt?: string;       // New alt text
  alts?: string[];    // New alt texts for multi-image
  category?: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
}

export default defineEventHandler(async (event) => {
  // Only accept POST/PUT requests
  if (event.method !== "POST" && event.method !== "PUT") {
    throw createError({
      statusCode: 405,
      message: "Method not allowed. Use POST or PUT.",
    });
  }

  try {
    const body = await readBody<UpdateImageInput>(event);

    // Validate required field
    if (!body.shortcode) {
      throw createError({
        statusCode: 400,
        message: "Shortcode is required",
      });
    }

    // Get auth token from cookie or header
    const authToken = getCookie(event, "signInAccessToken") ||
                      event.headers.get("authorization")?.replace("Bearer ", "").trim() ||
                      undefined;

    // Update figure in API
    const { getFigureByShortcode, updateFigure } = await import('../utils/figuresApi');
    
    // Check if shortcode exists
    const existing = await getFigureByShortcode(body.shortcode, authToken);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Shortcode "${body.shortcode}" not found`,
      });
    }

    // Extract figure number from shortcode if needed
    let figureNumber: string | undefined = undefined;
    const figureMatch = body.shortcode.match(/figure[_\s](\d+)[_\s](\d+)/i);
    if (figureMatch) {
      figureNumber = `${figureMatch[1]}.${figureMatch[2]}`;
    } else {
      const altMatch = body.shortcode.match(/figure[_\s](\d+)/i);
      if (altMatch) {
        figureNumber = altMatch[1];
      } else {
        const simMatch = body.shortcode.match(/Sim(\d+)/i);
        if (simMatch) {
          figureNumber = `Sim${simMatch[1]}`;
        }
      }
    }

    // Get page_number from figure-metadata.json if available
    let pageNumber: number | undefined = undefined;
    try {
      const dataDir = join(process.cwd(), "server", "data");
      const figureMetadataPath = join(dataDir, "figure-metadata.json");
      const metadataContent = await readFile(figureMetadataPath, "utf-8");
      const figureMetadata = JSON.parse(metadataContent);
      const metadataEntry = figureMetadata.images?.find((img: any) => img.shortcode === body.shortcode);
      if (metadataEntry) {
        pageNumber = metadataEntry.page_number;
      }
    } catch {
      // figure-metadata.json not found or invalid, that's okay
    }

    console.log(`[image-shortcode-update] Updating figure ${body.shortcode} in API...`);
    const updatedFigure = await updateFigure(body.shortcode, {
      alt: body.alt,
      description: body.description,
      category: body.category,
      subjectName: body.subjectName,
      chapterName: body.chapterName,
      topicName: body.topicName,
      figureNumber: figureNumber,
      path: body.path,
      paths: body.paths,
      alts: body.alts,
      page_number: pageNumber,
    }, authToken);

    if (!updatedFigure) {
      throw createError({
        statusCode: 500,
        message: "Failed to update figure in API",
      });
    }

    console.log(`[image-shortcode-update] ✅ Successfully updated figure ${body.shortcode} in API`);

    // Build response entry
    const entry: Record<string, any> = {
      alt: updatedFigure.alt,
      category: updatedFigure.category,
      description: updatedFigure.description,
      chapterName: updatedFigure.chapterName,
      topicName: updatedFigure.topicName,
      subjectName: updatedFigure.subjectName,
    };

    if (updatedFigure.paths && updatedFigure.paths.length > 0) {
      entry.paths = updatedFigure.paths;
      entry.alts = updatedFigure.alts;
    } else if (updatedFigure.path) {
      entry.path = updatedFigure.path;
    }

    return {
      success: true,
      message: `Image "${body.shortcode}" updated successfully`,
      shortcode: body.shortcode,
      entry: entry,
    };
  } catch (error: any) {
    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error;
    }

    console.error("[image-shortcode-update] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to update image",
    });
  }
});

