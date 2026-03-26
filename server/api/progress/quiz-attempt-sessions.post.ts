import type { QuizAttemptSessionPayload } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../utils/learnerProgressHistoryProxy";
import { clearRecommendationCache } from "../../utils/recommendationCache";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as QuizAttemptSessionPayload;

  const response = await proxyLearnerProgressJson<any>(
    event,
    apiDocs.progressTracking.postQuizAttemptSessions,
    {
      method: "POST",
      body,
    },
  );

  clearRecommendationCache();

  return response;
});
