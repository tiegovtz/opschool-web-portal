// import { isEmptyObject } from "@tiptap/core";

import apiDocs from "~/utilities/api-docs";

export default defineEventHandler(async (event) => {
  const { topicId } = getRouterParams(event); // Get query parameters
  const auth_token = getCookie(event, 'signInAccessToken');

  if (!auth_token) {
    return createError({
      statusCode: 401,
      message: 'No authorization token provided'
    });
  }

  if (!topicId) {
    return createError({
      statusCode: 401,
      message: 'Refference error: No identifier provided'
    });
  }

  console.log(apiDocs.topics.getTopicId.replaceAll(':id', topicId))


  try {
    const response = await fetch(apiDocs.topics.getTopicId.replaceAll(':id', topicId),{
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`
      }
    });


    if (!response.ok) {
      return createError({
        statusCode: response.status,
        message: `API returned ${response.status}: ${response.statusText}`
      });
    }



    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
});