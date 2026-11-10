import { getCookie } from "h3";
import { deleteFigure } from "../utils/figuresApi";

/**
 * API endpoint to delete a figure by its shortcode
 * DELETE /api/figure-delete?shortcode=xxx
 *
 * Only DELETE is accepted, so a GET (link, image tag, prefetch) can never
 * delete a figure.
 */
export default defineEventHandler(async (event) => {
  if (event.method !== "DELETE") {
    setResponseHeader(event, "Allow", "DELETE");
    throw createError({ statusCode: 405, message: "Method Not Allowed. Use DELETE." });
  }

  try {
    // Get shortcode from query (or a JSON body)
    const query = getQuery(event);
    let shortcode = typeof query.shortcode === "string" ? query.shortcode : undefined;

    if (!shortcode) {
      const body = await readBody(event).catch(() => ({}));
      shortcode = typeof body?.shortcode === "string" ? body.shortcode : undefined;
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
