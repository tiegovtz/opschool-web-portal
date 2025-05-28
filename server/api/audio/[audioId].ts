import apiDocs from "~/utilities/api-docs";

export default defineEventHandler(async (event) => {
  // Get the referer header
  const referer = getHeader(event, "referer");

// Check if the referer is valid
if (
    referer &&
    (referer?.toLowerCase().includes("/interactive/form") || referer?.toLowerCase().includes("/audio"))
  ) {
    const { audioId } = getRouterParams(event); // Get query parameters
    const auth_token = getCookie(event, "signInAccessToken");

    if (!auth_token) {
      throw createError({
        statusCode: 401,
        message: "No authorization token provided",
      });
    }

    if (!audioId) {
      throw createError({
        statusCode: 400,
        message: "Reference error: No identifier provided",
      });
    }

    const audioUrl = `${apiDocs.audio.streamAudio.replaceAll('{id}',`${audioId}`)}`;
   
    // Forward the request with headers (including the Authorization token)
    return proxyRequest(event, audioUrl, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
    });
  } else {
    //     return createError({ statusCode: 403, message: 'Access denied' });
    sendRedirect(event, "/error/access-denied", 301); // permanent Redirect
  }
});
