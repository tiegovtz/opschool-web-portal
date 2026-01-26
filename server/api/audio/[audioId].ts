import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {
  const { audioId } = getRouterParams(event);
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
      message: "No audio ID provided",
    });
  }

  const audioUrl = `${apiDocs.audio.streamAudio.replaceAll('{id}', audioId)}`;
  const range = getHeader(event, "range");

  try {
    const upstreamRes = await fetch(audioUrl, {
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

    // Forward critical headers for audio streaming
    const headersToForward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];
    headersToForward.forEach((key) => {
      const value = upstreamRes.headers.get(key);
      if (value) setHeader(event, key, value);
    });

    // Set status code
    setResponseStatus(event, upstreamRes.status);

    // Pipe upstream body to the client response
    const reader = upstreamRes.body?.getReader();
    const res = event.node.res;

    if (!reader) {
      throw createError({
        statusCode: 500,
        message: "Failed to read audio stream",
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return stream;
  } catch (error: any) {
    console.error("Audio streaming error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Audio streaming failed",
    });
  }
});
