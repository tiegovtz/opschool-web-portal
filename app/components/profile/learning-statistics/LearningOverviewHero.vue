<script setup lang="ts">
import { computed } from "vue";
import LearningDistributionBar from "@/components/profile/learning-statistics/LearningDistributionBar.vue";
import LearningDonutChart from "@/components/profile/learning-statistics/LearningDonutChart.vue";
import LearningMetricCard from "@/components/profile/learning-statistics/LearningMetricCard.vue";
import LearningProgressRing from "@/components/profile/learning-statistics/LearningProgressRing.vue";
import type { LearnerAnalysisOverview } from "~/types/recommendation.interface";

const props = defineProps<{
  overview: LearnerAnalysisOverview;
  topicCount: number;
}>();

const activeTopics = computed(
  () => props.overview.inProgressTopics + props.overview.openedTopics,
);

const topicSegments = computed(() => [
  {
    label: "Covered",
    value: props.overview.coveredTopics,
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Active",
    value: activeTopics.value,
    colorClass: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700",
  },
  {
    label: "Not started",
    value: props.overview.notStartedTopics,
    colorClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700",
  },
]);

const assessmentSegments = computed(() => [
  {
    label: "Passed",
    value: props.overview.passedTopics,
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Failed",
    value: props.overview.failedTopics,
    colorClass: "bg-rose-500",
    badgeClass: "bg-rose-50 text-rose-700",
  },
]);

const assessmentAverage = computed(() => props.overview.averageAssessmentScore);
const coveredRatioLabel = computed(
  () => `${props.overview.coveredTopics}/${props.overview.totalTopics}`,
);
const assessmentTotal = computed(
  () => props.overview.passedTopics + props.overview.failedTopics,
);
</script>

<template>
  <section class="relative overflow-hidden border shadow-sm rounded-[28px] border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#f7fafc_100%)] sm:rounded-[32px]">
    <div class="absolute rounded-full -top-12 right-8 h-44 w-44 bg-sky-100/50 blur-3xl"></div>
    <div class="absolute rounded-full bottom-0 left-10 h-32 w-32 bg-emerald-100/40 blur-3xl"></div>

    <div class="relative p-4 sm:p-5 lg:p-7">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)] lg:items-start">
        <div>
          <p class="text-[11px] font-semibold tracking-[0.3em] uppercase text-oceanBlue sm:text-xs">
            Learning Pulse
          </p>
          <h4 class="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Visual overview of syllabus coverage and quiz health
          </h4>
          <p class="mt-3 text-sm leading-6 text-slate-600 sm:leading-7">
            This view compresses topic coverage, active work, and assessment performance
            into a faster scan than the old number-first layout.
          </p>

          <div class="mt-4 flex flex-wrap gap-2 sm:mt-5">
            <span class="px-3 py-1.5 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
              Tracked topics {{ topicCount }}
            </span>
            <span class="px-3 py-1.5 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
              Subjects opened {{ overview.subjectsOpened }}/{{ overview.totalSubjects }}
            </span>
            <span class="px-3 py-1.5 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
              Quiz attempts {{ overview.totalAssessmentAttempts }}
            </span>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <LearningProgressRing
            label="Overall progress"
            :value="overview.averageProgress"
            accent="ocean"
            helper="Average progress across tracked topics."
          />
          <LearningProgressRing
            label="Assessment average"
            :value="assessmentAverage"
            accent="amber"
            helper="Average score from recorded topic quizzes."
          />
        </div>
      </div>

      <div class="grid gap-4 mt-5 lg:mt-6 xl:grid-cols-2">
        <article class="border rounded-3xl border-white bg-white/90 p-4 shadow-sm sm:p-5">
          <div class="grid gap-4 md:grid-cols-[minmax(10rem,0.68fr)_minmax(0,1fr)] md:items-center sm:gap-5">
            <LearningDonutChart
              :segments="[
                {
                  label: 'Covered',
                  value: overview.coveredTopics,
                  strokeClass: 'stroke-emerald-500',
                },
                {
                  label: 'Active',
                  value: activeTopics,
                  strokeClass: 'stroke-sky-500',
                },
                {
                  label: 'Not started',
                  value: overview.notStartedTopics,
                  strokeClass: 'stroke-slate-400',
                },
              ]"
              :total="overview.totalTopics"
              :center-primary="coveredRatioLabel"
              center-secondary="covered"
            />

            <div>
              <LearningDistributionBar
                title="Topic distribution"
                :segments="topicSegments"
                :total="overview.totalTopics"
              />
              <p class="mt-3 text-sm leading-6 text-slate-600 sm:mt-4">
                {{ overview.coveredTopics }}/{{ overview.totalTopics }} topics are already covered,
                while {{ activeTopics }} are still in motion.
              </p>
            </div>
          </div>
        </article>

        <article class="border rounded-3xl border-white bg-white/90 p-4 shadow-sm sm:p-5">
          <div class="grid gap-4 md:grid-cols-[minmax(10rem,0.68fr)_minmax(0,1fr)] md:items-center sm:gap-5">
            <LearningDonutChart
              :segments="[
                {
                  label: 'Passed',
                  value: overview.passedTopics,
                  strokeClass: 'stroke-emerald-500',
                },
                {
                  label: 'Failed',
                  value: overview.failedTopics,
                  strokeClass: 'stroke-rose-500',
                },
              ]"
              :total="assessmentTotal"
              :center-primary="String(overview.totalAssessmentAttempts)"
              center-secondary="attempts"
            />

            <div class="space-y-4">
              <LearningDistributionBar
                title="Assessment status"
                :segments="assessmentSegments"
                :total="assessmentTotal"
              />

              <div class="grid gap-3 sm:grid-cols-2">
                <LearningMetricCard
                  label="Coverage depth"
                  :value="coveredRatioLabel"
                  helper="Covered topics out of all tracked topics."
                  icon="heroicons:academic-cap-20-solid"
                  icon-wrapper-class="bg-emerald-100 text-emerald-700"
                  card-class="h-full"
                />
                <LearningMetricCard
                  label="Active topics"
                  :value="activeTopics"
                  helper="Topics opened or in active progress."
                  icon="heroicons:bolt-20-solid"
                  icon-wrapper-class="bg-sky-100 text-sky-700"
                  card-class="h-full"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
