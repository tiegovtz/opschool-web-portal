import { getPrimaryActivityById } from "../../../utils/primaryData";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    throw createError({
      statusCode: 400,
      statusMessage: "id is required",
    });
  }
  const activity = await getPrimaryActivityById(normalizedId);

  if (!activity) {
    throw createError({
      statusCode: 404,
      statusMessage: "Activity not found",
    });
  }

  return {
    success: true,
    activity,
  };
});
