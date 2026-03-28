import { getPrimaryActivityIds } from "../../../utils/primaryData";

export default defineEventHandler(async () => {
  const ids = await getPrimaryActivityIds();

  return {
    success: true,
    total: ids.length,
    ids,
  };
});
