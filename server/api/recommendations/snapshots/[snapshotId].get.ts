import type { RecommendationSnapshot } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  const snapshotId = getRouterParam(event, "snapshotId");

  if (!snapshotId) {
    throw createError({
      statusCode: 400,
      message: "snapshotId is required",
    });
  }

  return proxyLearnerProgressJson<RecommendationSnapshot>(
    event,
    apiDocs.recommendations.snapshotById.replace("{snapshotId}", snapshotId),
  );
});
