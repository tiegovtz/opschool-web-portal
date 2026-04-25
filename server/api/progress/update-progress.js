import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {
  const auth_token = getCookie(event, "signInAccessToken");
  const progressCookie = getCookie(event, "chapterProgress");

  let progress = null;

  if (progressCookie) {
    try {
      progress = JSON.parse(progressCookie);
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: "Invalid chapter progress cookie payload",
      });
    }
  }

  if (!auth_token) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided",
    });
  }

  if (!progress?.chapterId) {
    throw createError({
      statusCode: 400,
      message: "Bad request: No chapter progress provided",
    });
  }

  try {
    return await $fetch(
      apiDocs.progressTracking.putProgresschapterId.replaceAll(
        "{chapterId}",
        progress.chapterId,
      ),
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
