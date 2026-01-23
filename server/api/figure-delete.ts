import { getCookie } from "h3";
import { deleteFigure } from "../utils/figuresApi";

/**
 * API endpoint to delete a figure by its shortcode
 * DELETE /api/figure-delete?shortcode=xxx
 * or POST /api/figure-delete with body { shortcode: 'xxx' }
 */
export default defineEventHandler(async (event) => {
  try {
    // Get shortcode from query or body
    const query = getQuery(event);
    let shortcode = query.shortcode as string | undefined;
    
    // If not in query, try body (for POST requests)
    if (!shortcode) {
      const body = await readBody(event).catch(() => ({}));
      shortcode = body?.shortcode;
    }

    if (!shortcode) {
      throw createError({
        statusCode: 400,
        message: 'Shortcode is required to identify the figure',
      });
    }

    // Get auth token
    const authToken = getCookie(event, "signInAccessToken") ||
                      event.headers.get("authorization")?.replace("Bearer ", "").trim() ||
                      undefined;

    console.log(`[figure-delete] Deleting figure: ${shortcode}`);

    // Delete from API
    await deleteFigure(shortcode, authToken);

    return {
      success: true,
      message: `Successfully deleted figure: ${shortcode}`,
      shortcode,
    };
  } catch (error: any) {
    console.error('[figure-delete] Error:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete figure',
    });
  }
});
