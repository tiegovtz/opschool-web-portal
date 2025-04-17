import apiDocs from "~/utilities/api-docs";

export default defineEventHandler(async (event) => {
  const auth_token = getCookie(event, "signInAccessToken");
  let progress = getCookie(event, "chapterProgress");
  progress = JSON.parse(progress);

  if (!auth_token) {
    return createError({
      statusCode: 401,
      message: "No authorization token provided",
    });
  }

  if (!progress) {
    return createError({
      statusCode: 400,
      message: "Bad request: No request body provided",
    });
  }

  await $fetch(
    apiDocs.progressTracking.putProgresschapterId.replaceAll(
      "{chapterId}",
      progress.chapterId
    ),
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth_token}`,
        "Content-Type": "application/json",
      },
      body: progress,
    }
  )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return createError({
        statusCode: 500,
        message: error.message || "Internal server error",
      });
    });
});
