import type { QuizAttemptSessionPayload } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as QuizAttemptSessionPayload;

  return proxyLearnerProgressJson<any>(
    event,
    apiDocs.progressTracking.postQuizAttemptSessions,
    {
      method: "POST",
      body,
    },
  );
});
