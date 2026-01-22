import { defineEventHandler, getQuery, getCookie } from "h3";
import { getFigureByShortcode } from "../utils/figuresApi";

/**
 * API endpoint to resolve image shortcode to metadata
 * Used by frontend to get image paths for dynamic shortcodes from external API
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

    // Get auth token from cookie or header
    const authToken = getCookie(event, "signInAccessToken") ||
                      event.headers.get("authorization")?.replace("Bearer ", "").trim() ||
                      undefined;

    // Fetch figure from external API
    try {
      const figure = await getFigureByShortcode(shortcode, authToken);

      if (figure) {
        // Check if this is a multi-image figure (has paths array) or single image (has path)
        const isMultiImage = Array.isArray(figure.paths) && figure.paths.length > 0;
        
        const metadata: Record<string, any> = {
          alt: figure.alt,
          category: figure.category,
          description: figure.description,
          chapterName: figure.chapterName,
          topicName: figure.topicName,
          subjectName: figure.subjectName
        };
        
        if (isMultiImage) {
          // Multi-image figure: return paths and alts arrays
          metadata.paths = figure.paths;
          metadata.alts = figure.alts;
        } else {
          // Single image: return just path
          metadata.path = figure.path;
        }
        
        return {
          success: true,
          metadata
        };
      }

      return {
        success: false,
        error: "Shortcode not found",
        metadata: null
      };
    } catch (apiError: any) {
      // API call failed
      console.error('[image-shortcode-resolve] API error:', apiError);
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


