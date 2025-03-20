// import { isEmptyObject } from "@tiptap/core";

import apiDocs from "~/utilities/api-docs";

export default defineEventHandler(async (event) => {
  const { videoId } = getRouterParams(event); // Get query parameters
  const auth_token = getCookie(event, 'signInAccessToken');

  if (!auth_token) {
    throw createError({ statusCode: 401, message: 'No authorization token provided' });
  }

  if (!videoId) {
    throw createError({ statusCode: 400, message: 'Reference error: No identifier provided' });
  }

  const videoUrl = `${apiDocs.videos.getStream}${videoId}`;

  // Forward the request with headers (including the Authorization token)
  return proxyRequest(event, videoUrl, {
    headers: {
      'Authorization': `Bearer ${auth_token}`
    }
  });
});