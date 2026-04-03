<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import Activity from "~/components/activities/Activity.vue";
import { Button } from "~/components/ui/button";

const route = useRoute();
const router = useRouter();

const activityId = computed(() => String(route.params.activityId ?? ""));

const goBack = () => {
  router.back();
};

definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <div class="min-h-screen bg-sky-100">
    <div class="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div class="mb-5 flex items-start justify-start">
        <Button
          variant="brand"
          size="sm"
          class="w-fit rounded-xl"
          :onClick="goBack"
        >
          <Icon
            icon="heroicons:arrow-left-20-solid"
            class="mr-2"
            width="18"
            height="18"
          />
          Back
        </Button>
      </div>

      <section
        class="rounded-[2rem] border border-oceanBlue/10 bg-white/90 p-4 shadow-[0_24px_80px_-48px_rgba(1,61,96,0.55)] backdrop-blur md:p-8"
      >
        <div
          class="w-full overflow-x-hidden rounded-[1.5rem] border border-slate-100 bg-white p-3 md:p-6"
        >
          <Activity
            v-if="activityId"
            :key="activityId"
            :activity-id="activityId"
          />
        </div>
      </section>
    </div>
  </div>
</template>

