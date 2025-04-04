import apiDocsFile from "~/utilities/api-docs";;

export default defineEventHandler(async (event) => {
  const apiDocs = apiDocsFile.setup()
  const auth_token = getCookie(event, "signInAccessToken");

  if (!auth_token) {
    return createError({
      statusCode: 401,
      message: "No authorization token provided",
    });
  }

  try {
    const response = await fetch(apiDocs.topics.getTopics, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
    });

    if (!response.ok) {
      return createError({
        statusCode: response.status,
        message: `API returned ${response.status}: ${response.statusText}`,
      });
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching topics:", error);
    return createError({
      statusCode: 500,
      message: error.message || "Internal server error",
    });
  }
});
