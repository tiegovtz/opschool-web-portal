import type { QuizAttemptsWritePayload } from "~/types/recommendation.interface";
import {
  apiDocs,
  proxyLearnerProgressJson,
} from "../../utils/learnerProgressHistoryProxy";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as QuizAttemptsWritePayload;

  return proxyLearnerProgressJson<any>(
    event,
    apiDocs.progressTracking.postQuizAttempts,
    {
      method: "POST",
      body,
    },
  );
});
