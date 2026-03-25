import { defineAsyncComponent } from "vue";

export const InWhichBoxActivity = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/in-which-box")
);