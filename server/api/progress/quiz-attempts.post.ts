import type { QuizAttemptsWritePayload } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../utils/learnerProgressHistoryProxy";
import { clearRecommendationCache } from "../../utils/recommendationCache";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as QuizAttemptsWritePayload;

  const response = await proxyLearnerProgressJson<any>(
    event,
    apiDocs.progressTracking.postQuizAttempts,
    {
      method: "POST",
      body,
    },
  );

  clearRecommendationCache();

  return response;
});
