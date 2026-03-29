import type { TopicQuizHistoryResponse } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  const topicId = getRouterParam(event, "topicId");

  if (!topicId) {
    throw createError({
      statusCode: 400,
      message: "topicId is required",
    });
  }

  return proxyLearnerProgressJson<TopicQuizHistoryResponse>(
    event,
    apiDocs.progressTracking.getTopicQuizHistory.replace("{topicId}", topicId),
    {
      query: getQuery(event),
    },
  );
});
