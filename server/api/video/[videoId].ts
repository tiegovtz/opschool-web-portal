import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {
  const { videoId } = getRouterParams(event);
  const auth_token = getCookie(event, "signInAccessToken");

  if (!auth_token) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided",
    });
  }

  if (!videoId) {
    throw createError({ statusCode: 400, message: "No video ID provided" });
  }

  const videoUrl = apiDocs.videos.getStream + videoId;
  const range = getHeader(event, "range");

  try {
    const upstreamRes = await fetch(videoUrl, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
        ...(range ? { Range: range } : {}),
      },
    });

    if (!upstreamRes.ok) {
      throw createError({
        statusCode: upstreamRes.status,
        message: `Upstream API returned ${upstreamRes.status}: ${upstreamRes.statusText}`,
      });
    }

    // Forward critical headers for video streaming
    const headersToForward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ];
    headersToForward.forEach((key) => {
      const value = upstreamRes.headers.get(key);
      if (value) setHeader(event, key, value);
    });

    // Pipe upstream body to the client response
    const reader = upstreamRes.body?.getReader();
    const res = event.node.res;

    if (!reader)
      throw createError({
        statusCode: 500,
        message: "Failed to read video stream",
      });

    res.statusCode = upstreamRes.status;

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return stream;
  } catch (error: any) {
    console.error("Video streaming error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Video streaming failed",
    });
  }
});
