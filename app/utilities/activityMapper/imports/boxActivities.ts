import dynamic from "next/dynamic";

export const InWhichBoxActivity = dynamic(
  () => import("@/components/activities/in-which-box")
);
