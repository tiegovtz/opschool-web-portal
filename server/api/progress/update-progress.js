export default defineEventHandler(async (event) => {
  const bearerToken = getHeader(event, "authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const auth_token = bearerToken || getCookie(event, "signInAccessToken");
  const progress = await readBody(event);

  if (!auth_token) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided",
    });
  }

  if (!progress || typeof progress !== "object" || !progress.chapterId) {
    throw createError({
      statusCode: 400,
      message: "Bad request: No chapter progress provided in request body",
    });
  }

  try {
    return await $fetch(
      `/api/backend/v1/progress/chapters/${encodeURIComponent(String(progress.chapterId))}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth_token}`,
          "Content-Type": "application/json",
        },
        body: progress,
      },
    );
  } catch (error) {
    throw createError({
      statusCode: Number(error?.statusCode || error?.status || 500),
      message: error?.message || "Internal server error",
    });
  }
});
