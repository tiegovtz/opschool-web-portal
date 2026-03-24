import dynamic from "next/dynamic";

export const DialogDifferences = dynamic(
  () => import("@/components/activities/dialog-differences")
);
