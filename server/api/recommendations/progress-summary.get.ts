import type { RecommendationProgressSummaryResponse } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  return proxyLearnerProgressJson<RecommendationProgressSummaryResponse>(
    event,
    apiDocs.recommendations.progressSummary,
  );
});
