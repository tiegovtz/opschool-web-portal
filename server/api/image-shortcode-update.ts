import { readFile, writeFile } from "fs/promises";
import { join } from "path";

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
      throw createError({
        statusCode: 404,
        message: "Image shortcodes file not found",
      });
    }

    // Check if shortcode exists
    if (!existingData.shortcodes[body.shortcode]) {
      throw createError({
        statusCode: 404,
        message: `Shortcode "${body.shortcode}" not found`,
      });
    }

    // Get existing entry
    const existingEntry = existingData.shortcodes[body.shortcode];

    // Update fields if provided
    if (body.path !== undefined) {
      existingEntry.path = body.path;
      // Remove paths if switching to single image
      delete existingEntry.paths;
      delete existingEntry.alts;
    }
    if (body.paths !== undefined && body.paths.length > 0) {
      existingEntry.paths = body.paths;
      existingEntry.alts = body.alts || [];
      // Remove path if switching to multi-image
      delete existingEntry.path;
    }
    if (body.alt !== undefined) {
      existingEntry.alt = body.alt;
    }
    if (body.alts !== undefined) {
      existingEntry.alts = body.alts;
    }
    if (body.category !== undefined) {
      existingEntry.category = body.category;
    }
    if (body.description !== undefined) {
      existingEntry.description = body.description;
    }
    if (body.chapterName !== undefined) {
      existingEntry.chapterName = body.chapterName;
    }
    if (body.topicName !== undefined) {
      existingEntry.topicName = body.topicName;
    }
    if (body.subjectName !== undefined) {
      existingEntry.subjectName = body.subjectName;
    }

    // Update searchable text
    const figureMatch = body.shortcode.match(/figure_(\d+)_(\d+)/);
    const figureNumber = figureMatch ? `${figureMatch[1]}.${figureMatch[2]}` : "";
    existingEntry.searchableText = `${body.shortcode} Figure ${figureNumber} ${existingEntry.alt || ""} ${existingEntry.description || ""} ${existingEntry.chapterName || ""} ${existingEntry.topicName || ""}`.trim();

    // Update the entry
    existingData.shortcodes[body.shortcode] = existingEntry;
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

    // Write back to image-shortcodes.json
    await writeFile(filePath, JSON.stringify(existingData, null, 2), "utf-8");

    // Also update figure-metadata.json
    const figureMetadataPath = join(dataDir, "figure-metadata.json");
    try {
      const metadataContent = await readFile(figureMetadataPath, "utf-8");
      const figureMetadata = JSON.parse(metadataContent);

      // Find and update the corresponding entry
      const metadataIndex = figureMetadata.images?.findIndex(
        (img: any) => img.shortcode === body.shortcode
      );

      if (metadataIndex !== -1 && metadataIndex !== undefined) {
        const metadataEntry = figureMetadata.images[metadataIndex];
        if (body.alt !== undefined) metadataEntry.caption = body.alt;
        if (body.description !== undefined) metadataEntry.description = body.description;
        if (body.chapterName !== undefined) metadataEntry.chapter = body.chapterName;
        if (body.topicName !== undefined) metadataEntry.topic = body.topicName;
        if (body.subjectName !== undefined) metadataEntry.subject = body.subjectName;

        await writeFile(figureMetadataPath, JSON.stringify(figureMetadata, null, 2), "utf-8");
      }
    } catch (err) {
      // Silently fail if figure-metadata.json doesn't exist or can't be updated
      console.warn("[image-shortcode-update] Could not update figure-metadata.json:", err);
    }

    return {
      success: true,
      message: `Image "${body.shortcode}" updated successfully`,
      shortcode: body.shortcode,
      entry: existingEntry,
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

