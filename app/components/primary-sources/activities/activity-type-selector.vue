<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const route = useRoute();

const curriculum = computed(() => String(route.query.curc || "").trim());

const activityTypes = [
  {
    type: "activities",
    label: "Start Learning",
    description: "Interactive activities to build knowledge",
    icon: "lucide:book-open",
    borderColor: "border-picton-blue-200 hover:border-picton-blue-400",
    bgColor: "bg-picton-blue-100 group-hover:bg-picton-blue-200",
    iconColor: "text-picton-blue-600 group-hover:text-picton-blue-700",
    buttonBg: "bg-picton-blue-500 group-hover:bg-picton-blue-600",
    gradientFrom: "from-picton-blue-50",
    activeCurriculum: ["Tanzania Curriculum", "Cambridge"],
  },
  {
    type: "tests",
    label: "Test Yourself",
    description: "Practice tests to check understanding",
    icon: "lucide:pen-line",
    borderColor: "border-lemon-200 hover:border-lemon-400",
    bgColor: "bg-lemon-100 group-hover:bg-lemon-200",
    iconColor: "text-lemon-600 group-hover:text-lemon-700",
    buttonBg: "bg-lemon-500 group-hover:bg-lemon-600",
    gradientFrom: "from-lemon-50",
    activeCurriculum: ["Tanzania Curriculum"],
  },
  {
    type: "exams",
    label: "Take Exam",
    description: "Comprehensive exams for assessment",
    icon: "lucide:graduation-cap",
    borderColor: "border-purple-200 hover:border-purple-400",
    bgColor: "bg-purple-100 group-hover:bg-purple-200",
    iconColor: "text-purple-600 group-hover:text-purple-700",
    buttonBg: "bg-purple-500 group-hover:bg-purple-600",
    gradientFrom: "from-purple-50",
    activeCurriculum: ["Tanzania Curriculum"],
  },
];

const backHref = computed(() =>
  `/activities${curriculum.value ? `?curc=${encodeURIComponent(curriculum.value)}` : ""}`,
);

const handleSelect = async (type: string) => {
  const params = new URLSearchParams(route.query as Record<string, string>);
  if (type === "activities") {
    params.set("type", type);
  }

  await navigateTo(`/${type}${params.toString() ? `?${params.toString()}` : ""}`);
};
</script>

<template>
  <div class="container mx-auto px-0 py-6 md:py-20">
    <div class="mb-12">
      <div class="mb-4 flex items-center justify-between">
        <Button :href="backHref" class="w-fit xl:hidden">
          <Icon icon="lucide:arrow-left" width="16" height="16" class="mr-1" />
          Back
        </Button>

        <div
          v-if="curriculum"
          class="rounded-full border border-oceanBlue/15 bg-white px-4 py-2 text-sm text-oceanBlue shadow-sm"
        >
          {{ curriculum }}
        </div>
      </div>

      <h2 class="mb-4 text-center text-3xl font-bold tracking-wide text-picton-blue-900 lg:text-5xl">
        What would you like to do?
      </h2>
      <p
        class="text-center text-xl text-picton-blue-700"
        style="font-family: var(--font-shaky-hand-some-comic)"
      >
        Choose your learning path
      </p>
    </div>

    <div class="mx-auto grid grid-cols-1 gap-6 md:max-w-6xl md:grid-cols-3 md:px-4">
      <button
        v-for="activity in activityTypes"
        :key="activity.type"
        type="button"
        :class="
          cn(
            'group relative overflow-hidden rounded-2xl border-2 bg-white p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
            activity.activeCurriculum.includes(curriculum || '')
              ? activity.borderColor
              : 'pointer-events-none opacity-50 grayscale',
          )
        "
        @click="handleSelect(activity.type)"
      >
        <div class="flex flex-col items-center space-y-4 text-center">
          <div
            :class="`flex h-20 w-20 items-center justify-center rounded-full transition-colors duration-300 ${activity.bgColor}`"
          >
            <Icon :icon="activity.icon" width="40" height="40" :class="activity.iconColor" />
          </div>

          <div>
            <h3 class="mb-2 text-2xl font-bold text-picton-blue-900">
              {{ activity.label }}
            </h3>
            <p
              class="text-picton-blue-600"
              style="font-family: var(--font-shaky-hand-some-comic)"
            >
              {{ activity.description }}
            </p>
          </div>

          <div
            :class="`mt-4 rounded-full px-6 py-2 font-semibold text-white transition-colors duration-300 ${activity.buttonBg}`"
          >
            Get Started
          </div>
        </div>

        <div
          :class="`absolute inset-0 -z-10 bg-gradient-to-br ${activity.gradientFrom} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`"
        />
      </button>
    </div>
  </div>
</template>
