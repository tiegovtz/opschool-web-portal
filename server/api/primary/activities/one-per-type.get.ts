import { getPrimaryActivityOnePerType } from "../../../utils/primaryData";

export default defineEventHandler(async () => {
  const items = await getPrimaryActivityOnePerType();
  const matched = items.filter((item) => item.activity !== null);
  const missingTypes = items
    .filter((item) => item.activity === null)
    .map((item) => item.type);

  return {
    success: true,
    totalTypes: items.length,
    matchedTypes: matched.length,
    missingTypes,
    items: matched,
  };
});
