import { ActivityType } from "@/types/activity-types";
import { DialogDifferences } from "../imports";

export const dialogMapper = {
  [ActivityType.DialogDifferences]: DialogDifferences,
  [ActivityType.DialogOneSideFixed]: DialogDifferences,
};
