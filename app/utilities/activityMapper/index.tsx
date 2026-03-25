import { boxMapper } from "./mappers/boxMapper";
import { gameMapper } from "./mappers/gameMapper";
import { otherMapper } from "./mappers/otherMapper";
import { dialogMapper } from "./mappers/dialogMapper";
import { type ActivityMapper } from "@/types/activity-types";
import { connectionMapper } from "./mappers/connectionMapper";
import { completeSentenceMapper } from "./mappers/completeSentenceMapper";

const activityComponents: ActivityMapper = {
  ...connectionMapper,
  ...dialogMapper,
  ...boxMapper,
  ...completeSentenceMapper,
  ...otherMapper,
  ...gameMapper,
};

export default activityComponents;
