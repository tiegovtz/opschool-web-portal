import { ActivityType } from "@/types/activity-types";
import { ConnectionWall } from "../imports";

export const connectionMapper = {
  [ActivityType.ConnectionWall]: ConnectionWall,
  [ActivityType.ConnectionWallThreeRows]: ConnectionWall,
  [ActivityType.ConnectionWallPic]: ConnectionWall,
  [ActivityType.ConnectionWallPicText]: ConnectionWall,
  [ActivityType.ConnectionWallGames]: ConnectionWall,
};
