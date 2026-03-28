import type { RecommendationSnapshot } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  return proxyLearnerProgressJson<RecommendationSnapshot>(
    event,
    apiDocs.recommendations.snapshotLatest,
  );
});
