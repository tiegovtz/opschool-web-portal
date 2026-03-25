import { defineAsyncComponent } from "vue";

export const ConnectionWall = defineAsyncComponent(
  () => import("@/components/primary-sources/activities/connection-wall")
);
