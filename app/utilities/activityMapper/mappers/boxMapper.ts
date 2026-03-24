import { ActivityType } from "@/lib/types/activity-types";
import { InWhichBoxActivity } from "../imports";

export const boxMapper = {
  [ActivityType.InWhichBox]: InWhichBoxActivity,
  [ActivityType.InWhichBoxPics]: InWhichBoxActivity,
  [ActivityType.InWhichBoxMixedThreeBoxes]: InWhichBoxActivity,
  [ActivityType.InWhichBoxMixedTwoBoxesSixItems]: InWhichBoxActivity,
  [ActivityType.InWhichBoxTwoBoxes]: InWhichBoxActivity,
  [ActivityType.InWhichBoxPicsTwoBoxes]: InWhichBoxActivity,
  [ActivityType.InWhichBoxPicsTwoBoxesSixItems]: InWhichBoxActivity,
};
