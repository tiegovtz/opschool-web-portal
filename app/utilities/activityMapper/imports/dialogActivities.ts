import { defineAsyncComponent } from "vue";

export const DialogDifferences = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/dialog-differences")
);
