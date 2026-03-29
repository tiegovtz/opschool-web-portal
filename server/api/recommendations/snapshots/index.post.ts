import type { RecommendationSnapshotCreateResponse } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return proxyLearnerProgressJson<RecommendationSnapshotCreateResponse>(
    event,
    apiDocs.recommendations.snapshots,
    {
      method: "POST",
      body,
    },
  );
});
