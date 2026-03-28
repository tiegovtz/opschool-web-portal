import { getPrimaryActivities } from "../../../utils/primaryData";

export default defineEventHandler(async () => {
  const activities = await getPrimaryActivities();

  return {
    success: true,
    total: activities.length,
    activities,
  };
});
