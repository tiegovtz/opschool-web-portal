import dynamic from "next/dynamic";

export const ConnectionWall = dynamic(
  () => import("@/components/activities/connection-wall")
);
