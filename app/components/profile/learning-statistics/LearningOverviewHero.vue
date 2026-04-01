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
  language?: "english" | "kiswahili";
}>();

const isSw = computed(() => props.language === "kiswahili");
const text = computed(() => ({
  covered: isSw.value ? "Zimekamilika" : "Covered",
  active: isSw.value ? "Zinaendelea" : "Active",
  notStarted: isSw.value ? "Hazijaanza" : "Not started",
  passed: isSw.value ? "Umefaulu" : "Passed",
  failed: isSw.value ? "Umefeli" : "Failed",
  learningPulse: isSw.value ? "Mwelekeo wa Ujifunzaji" : "Learning Pulse",
  overviewTitle: isSw.value
    ? "Muhtasari wa kuona wa ufunikaji wa silabasi na afya ya majaribio"
    : "Visual overview of syllabus coverage and quiz health",
  overviewBody: isSw.value
    ? "Mwonekano huu unakusanya ufunikaji wa mada, kazi zinazoendelea, na matokeo ya tathmini ili usome kwa haraka zaidi."
    : "This view compresses topic coverage, active work, and assessment performance into a faster scan than the old number-first layout.",
  trackedTopics: isSw.value ? "Mada zilizofuatiliwa" : "Tracked topics",
  subjectsOpened: isSw.value ? "Masomo yaliyofunguliwa" : "Subjects opened",
  quizAttempts: isSw.value ? "Majaribio ya quiz" : "Quiz attempts",
  overallProgress: isSw.value ? "Maendeleo ya jumla" : "Overall progress",
  overallProgressHelper: isSw.value ? "Wastani wa maendeleo kwenye mada zilizofuatiliwa." : "Average progress across tracked topics.",
  assessmentAverage: isSw.value ? "Wastani wa tathmini" : "Assessment average",
  assessmentAverageHelper: isSw.value ? "Wastani wa alama kutoka kwenye quiz zilizorekodiwa." : "Average score from recorded topic quizzes.",
  topicDistribution: isSw.value ? "Mgawanyo wa mada" : "Topic distribution",
  coveredCenter: isSw.value ? "zimekamilika" : "covered",
  attemptsCenter: isSw.value ? "majaribio" : "attempts",
  assessmentStatus: isSw.value ? "Hali ya tathmini" : "Assessment status",
  coverageDepth: isSw.value ? "Kina cha ufunikaji" : "Coverage depth",
  coverageDepthHelper: isSw.value ? "Mada zilizokamilika kati ya zote zilizofuatiliwa." : "Covered topics out of all tracked topics.",
  activeTopics: isSw.value ? "Mada zinazotumika" : "Active topics",
  activeTopicsHelper: isSw.value ? "Mada zilizofunguliwa au zinazoendelea." : "Topics opened or in active progress.",
  items: isSw.value ? "vipengele" : "items",
  progressRingEmpty: isSw.value ? "Inasubiri taarifa zilizofuatiliwa" : "Awaiting tracked data",
  progressRingActive: isSw.value ? "Ishara ya sasa ya ujifunzaji" : "Current learning signal",
  topicDistributionSummary: isSw.value
    ? `${props.overview.coveredTopics}/${props.overview.totalTopics} ya mada zimefunikwa tayari, huku ${activeTopics.value} zikiendelea sasa.`
    : `${props.overview.coveredTopics}/${props.overview.totalTopics} topics are already covered, while ${activeTopics.value} are still in motion.`,
}));

const activeTopics = computed(
  () => props.overview.inProgressTopics + props.overview.openedTopics,
);

const topicSegments = computed(() => [
  {
    label: text.value.covered,
    value: props.overview.coveredTopics,
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: text.value.active,
    value: activeTopics.value,
    colorClass: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700",
  },
  {
    label: text.value.notStarted,
    value: props.overview.notStartedTopics,
    colorClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700",
  },
]);

const assessmentSegments = computed(() => [
  {
    label: text.value.passed,
    value: props.overview.passedTopics,
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: text.value.failed,
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
            {{ text.learningPulse }}
          </p>
          <h4 class="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {{ text.overviewTitle }}
          </h4>
          <p class="mt-3 text-sm leading-6 text-slate-600 sm:leading-7">
            {{ text.overviewBody }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2 sm:mt-5">
            <span class="px-3 py-1.5 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
              {{ text.trackedTopics }} {{ topicCount }}
            </span>
            <span class="px-3 py-1.5 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
              {{ text.subjectsOpened }} {{ overview.subjectsOpened }}/{{ overview.totalSubjects }}
            </span>
            <span class="px-3 py-1.5 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
              {{ text.quizAttempts }} {{ overview.totalAssessmentAttempts }}
            </span>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <LearningProgressRing
            :label="text.overallProgress"
            :value="overview.averageProgress"
            accent="ocean"
            :helper="text.overallProgressHelper"
            :empty-state-label="text.progressRingEmpty"
            :active-state-label="text.progressRingActive"
          />
          <LearningProgressRing
            :label="text.assessmentAverage"
            :value="assessmentAverage"
            accent="amber"
            :helper="text.assessmentAverageHelper"
            :empty-state-label="text.progressRingEmpty"
            :active-state-label="text.progressRingActive"
          />
        </div>
      </div>

      <div class="grid gap-4 mt-5 lg:mt-6 xl:grid-cols-2">
        <article class="border rounded-3xl border-white bg-white/90 p-4 shadow-sm sm:p-5">
          <div class="grid gap-4 md:grid-cols-[minmax(10rem,0.68fr)_minmax(0,1fr)] md:items-center sm:gap-5">
            <LearningDonutChart
              :segments="[
                {
                  label: text.covered,
                  value: overview.coveredTopics,
                  strokeClass: 'stroke-emerald-500',
                },
                {
                  label: text.active,
                  value: activeTopics,
                  strokeClass: 'stroke-sky-500',
                },
                {
                  label: text.notStarted,
                  value: overview.notStartedTopics,
                  strokeClass: 'stroke-slate-400',
                },
              ]"
              :total="overview.totalTopics"
              :center-primary="coveredRatioLabel"
              :center-secondary="text.coveredCenter"
            />

            <div>
              <LearningDistributionBar
                :title="text.topicDistribution"
                :segments="topicSegments"
                :total="overview.totalTopics"
                :item-label="text.items"
              />
              <p class="mt-3 text-sm leading-6 text-slate-600 sm:mt-4">
                {{ text.topicDistributionSummary }}
              </p>
            </div>
          </div>
        </article>

        <article class="border rounded-3xl border-white bg-white/90 p-4 shadow-sm sm:p-5">
          <div class="grid gap-4 md:grid-cols-[minmax(10rem,0.68fr)_minmax(0,1fr)] md:items-center sm:gap-5">
            <LearningDonutChart
              :segments="[
                {
                  label: text.passed,
                  value: overview.passedTopics,
                  strokeClass: 'stroke-emerald-500',
                },
                {
                  label: text.failed,
                  value: overview.failedTopics,
                  strokeClass: 'stroke-rose-500',
                },
              ]"
              :total="assessmentTotal"
              :center-primary="String(overview.totalAssessmentAttempts)"
              :center-secondary="text.attemptsCenter"
            />

            <div class="space-y-4">
              <LearningDistributionBar
                :title="text.assessmentStatus"
                :segments="assessmentSegments"
                :total="assessmentTotal"
                :item-label="text.items"
              />

              <div class="grid gap-3 sm:grid-cols-2">
                <LearningMetricCard
                  :label="text.coverageDepth"
                  :value="coveredRatioLabel"
                  :helper="text.coverageDepthHelper"
                  icon="heroicons:academic-cap-20-solid"
                  icon-wrapper-class="bg-emerald-100 text-emerald-700"
                  card-class="h-full"
                />
                <LearningMetricCard
                  :label="text.activeTopics"
                  :value="activeTopics"
                  :helper="text.activeTopicsHelper"
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
