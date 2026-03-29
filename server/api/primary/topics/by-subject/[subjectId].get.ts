import { getPrimaryTopicsBySubject } from "../../../../utils/primaryData";

export default defineEventHandler(async (event) => {
  const { subjectId } = getRouterParams(event);
  const normalizedSubjectId = String(subjectId ?? "").trim();

  if (!normalizedSubjectId) {
    throw createError({
      statusCode: 400,
      statusMessage: "subjectId is required",
    });
  }

  const topics = await getPrimaryTopicsBySubject(normalizedSubjectId);

  return {
    success: true,
    subjectId: normalizedSubjectId,
    total: topics.length,
    topics,
  };
});
