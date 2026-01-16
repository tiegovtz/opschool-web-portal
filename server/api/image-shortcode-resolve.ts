import { readFile } from "fs/promises";
import { join } from "path";
import { defineEventHandler, getQuery } from "h3";

/**
 * API endpoint to resolve image shortcode to metadata
 * Used by frontend to get image paths for dynamic shortcodes from JSON file
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const shortcode = query.shortcode as string;

    if (!shortcode) {
      return {
        success: false,
        error: "Missing shortcode parameter",
        metadata: null
      };
    }

    // Load shortcodes from JSON file
    try {
      const filePath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
      const fileContent = await readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const shortcodeData = data.shortcodes?.[shortcode];

      if (shortcodeData) {
        return {
          success: true,
          metadata: {
            path: shortcodeData.path,
            alt: shortcodeData.alt,
            category: shortcodeData.category,
            description: shortcodeData.description,
            chapterName: shortcodeData.chapterName,
            topicName: shortcodeData.topicName
          }
        };
      }

      return {
        success: false,
        error: "Shortcode not found",
        metadata: null
      };
    } catch (fileError: any) {
      // File doesn't exist or can't be read
      return {
        success: false,
        error: "Shortcode registry not available",
        metadata: null
      };
    }
  } catch (error: any) {
    console.error('[image-shortcode-resolve] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      metadata: null
    };
  }
});


