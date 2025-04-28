// // import { isEmptyObject } from "@tiptap/core";
import apiDocsFile from "~/utilities/api-docs";
// import Hls from 'hls.js';

export default defineEventHandler(async (event) => {
  // get refferer header
  // Get the referer header
  const referer = getHeader(event, "referer");
  const apiDocs = apiDocsFile.setup()
// Check if the referer is valid
if (
    referer &&
    (referer?.includes("/interactive/form") || referer?.includes("/video"))
  ) {
    const { videoId } = getRouterParams(event); // Get query parameters
    const auth_token = getCookie(event, "signInAccessToken");

    if (!auth_token) {
      throw createError({
        statusCode: 401,
        message: "No authorization token provided",
      });
    }

    if (!videoId) {
      throw createError({
        statusCode: 400,
        message: "Reference error: No identifier provided",
      });
    }

    const videoUrl = `http://127.0.0.1:5500/v1/video-blob/${videoId}`;

    // Forward the request with headers (including the Authorization token)
    return proxyRequest(event, videoUrl, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
    });
  } else {
    //     return createError({ statusCode: 403, message: 'Access denied' });
    sendRedirect(event, "/error/access-denied", 301); // permanent Redirect
  }
});
