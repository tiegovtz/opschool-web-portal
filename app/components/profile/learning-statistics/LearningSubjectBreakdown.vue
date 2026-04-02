<script setup lang="ts">
import { computed, ref } from "vue";
import LearningDistributionBar from "@/components/profile/learning-statistics/LearningDistributionBar.vue";
import LearningDonutChart from "@/components/profile/learning-statistics/LearningDonutChart.vue";
import type {
  RecommendationComparisonTopic,
  SubjectLearningAnalysis,
  TopicAssessmentStatus,
  TopicLearningAnalysis,
  TopicLearningStatus,
} from "~/types/recommendation.interface";

const props = withDefaults(
  defineProps<{
    subjects: SubjectLearningAnalysis[];
    comparisonTopics?: RecommendationComparisonTopic[];
  }>(),
  {
    comparisonTopics: () => [],
  },
);

const emit = defineEmits<{
  (event: "open-improvement", topicId: string): void;
  (event: "open-ai", seedPrompt: string): void;
}>();

const expandedSubjectTopics = ref<Record<string, boolean>>({});
const pageLanguage = useHubPageLanguage();
const isSw = computed(() => pageLanguage.value === "kiswahili");

const text = computed(() => ({
  covered: isSw.value ? "Zimekamilika" : "Covered",
  active: isSw.value ? "Zinaendelea" : "Active",
  notStarted: isSw.value ? "Hazijaanza" : "Not started",
  passed: isSw.value ? "Umefaulu" : "Passed",
  failed: isSw.value ? "Umefeli" : "Failed",
  notAttempted: isSw.value ? "Haijajaribiwa" : "Not attempted",
  inProgress: isSw.value ? "Inaendelea" : "In progress",
  openedOnly: isSw.value ? "Imefunguliwa tu" : "Opened only",
  improved: isSw.value ? "Imeboreshwa" : "Improved",
  resolved: isSw.value ? "Imetatuliwa" : "Resolved",
  regressed: isSw.value ? "Imerudi nyuma" : "Regressed",
  noChapterData: isSw.value ? "Hakuna taarifa za sura" : "No chapter data",
  chapters: isSw.value ? "sura" : "chapters",
  chaptersCompleted: isSw.value ? "zimekamilika" : "completed",
  topicCoverageNearlyComplete: isSw.value ? "Ufunikaji wa mada unakaribia kukamilika" : "Topic coverage is nearly complete",
  topicActivityStarted: isSw.value ? "Shughuli ya mada imeanza" : "Topic activity has started",
  topicNotStartedYet: isSw.value ? "Mada haijaanza bado" : "Topic not started yet",
  noUrgentTopicGaps: isSw.value ? "Hakuna mapengo ya mada ya haraka" : "No urgent topic gaps",
  needsRecovery: isSw.value ? "Inahitaji kurekebishwa" : "Needs recovery",
  coverageGaps: isSw.value ? "Kuna mapengo ya ufunikaji" : "Coverage gaps",
  buildingMomentum: isSw.value ? "Inaongeza kasi" : "Building momentum",
  stable: isSw.value ? "Imara" : "Stable",
  noTrackedImprovement: isSw.value ? "Hakuna maboresho yaliyofuatiliwa bado" : "No tracked improvement yet",
  progress: isSw.value ? "Maendeleo" : "Progress",
  quiz: "Quiz",
  attempts: isSw.value ? "Majaribio" : "Attempts",
  helpStudyPrompt: isSw.value
    ? "Nisaidie kusoma"
    : "Help me study",
  subjectAndTopicProgress: isSw.value ? "Maendeleo ya Masomo na Mada" : "Subject And Topic Progress",
  subjectAndTopicHelper: isSw.value
    ? "Kila somo sasa linaanza na muhtasari wa kuona kabla ya orodha ya kina ya mada."
    : "Each subject now leads with a visual breakdown before the detailed topic list.",
  subjectsTracked: isSw.value ? "masomo yamefuatiliwa" : "subjects tracked",
  coveredInline: isSw.value ? "zimekamilika" : "covered",
  failedInline: isSw.value ? "umefeli" : "failed",
  priorityTopics: isSw.value ? "Mada za kipaumbele:" : "Priority topics:",
  subjectDistribution: isSw.value ? "Mgawanyo wa somo" : "Subject distribution",
  coveredCenter: isSw.value ? "zimekamilika" : "covered",
  subjectDistributionSummary: (activeCount: number) =>
    isSw.value
      ? `Kazi inayoendelea imejikita kwenye mada ${activeCount} kwa sasa.`
      : `Active work is concentrated in ${activeCount} topics right now.`,
  subjectProgress: isSw.value ? "Maendeleo ya somo" : "Subject progress",
  coverageDepth: isSw.value ? "Kina cha ufunikaji" : "Coverage depth",
  quizAttempts: isSw.value ? "Majaribio ya quiz" : "Quiz attempts",
  passedTopics: isSw.value ? "Mada ulizofaulu" : "Passed topics",
  failedTopics: isSw.value ? "Mada ulizofeli" : "Failed topics",
  showingTopicDetails: (subjectName: string, many: boolean) =>
    isSw.value
      ? `Inaonyesha maelezo ya kiwango cha mada kwa ${subjectName}.${many ? " Kwa chaguo-msingi, mada 5 zenye hatari kubwa zaidi ndizo huonyeshwa kwanza." : ""}`
      : `Showing topic-level details for ${subjectName}.${many ? " By default, only the 5 highest-risk topics are shown first." : ""}`,
  showTop5Only: isSw.value ? "Onyesha 5 bora tu" : "Show top 5 only",
  showAllTopics: (count: number) =>
    isSw.value ? `Onyesha mada zote ${count}` : `Show all ${count} topics`,
  topicProgress: isSw.value ? "Maendeleo ya mada" : "Topic progress",
  sinceSnapshot: isSw.value ? "Tangu Picha ya Mapendekezo" : "Since Recommendation Snapshot",
  attemptsSinceSnapshot: isSw.value ? "Majaribio tangu picha:" : "Attempts since snapshot:",
  viewImprovement: isSw.value ? "Tazama maboresho" : "View improvement",
  openTopic: isSw.value ? "Fungua Mada" : "Open Topic",
  analyzeWithAi: isSw.value ? "Chambua kwa AI" : "Analyze with AI",
  items: isSw.value ? "vipengele" : "items",
}));

const topicStatusLabels = computed<Record<TopicLearningStatus, string>>(() => ({
  covered: text.value.covered,
  in_progress: text.value.inProgress,
  opened_only: text.value.openedOnly,
  not_started: text.value.notStarted,
}));

const assessmentStatusLabels = computed<Record<TopicAssessmentStatus, string>>(() => ({
  passed: text.value.passed,
  failed: text.value.failed,
  not_attempted: text.value.notAttempted,
}));

const recommendationOutcomeLabels = computed(() => ({
  not_started: text.value.notStarted,
  in_progress: text.value.inProgress,
  improved: text.value.improved,
  resolved: text.value.resolved,
  regressed: text.value.regressed,
}) as const);

const comparisonTopicById = computed(
  () => new Map(props.comparisonTopics.map((topic) => [topic.topicId, topic])),
);

const buildProgressWidth = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const buildSubjectCoverageWidth = (subject: SubjectLearningAnalysis) => {
  if (!subject.totalTopics) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((subject.coveredTopics / subject.totalTopics) * 100)),
  );
};

const formatTopicStatus = (status: TopicLearningStatus) =>
  topicStatusLabels.value[status] ?? status.replaceAll("_", " ");

const formatAssessmentStatus = (status: TopicAssessmentStatus) =>
  assessmentStatusLabels.value[status] ?? status.replaceAll("_", " ");

const getTopicStatusClass = (status: TopicLearningStatus) => {
  if (status === "covered") return "bg-emerald-100 text-emerald-800";
  if (status === "in_progress") return "bg-sky-100 text-sky-800";
  if (status === "opened_only") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
};

const getAssessmentStatusClass = (status: TopicAssessmentStatus) => {
  if (status === "passed") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
};

const getProgressBarClass = (
  status: TopicLearningStatus | "subject",
) => {
  if (status === "covered") {
    return "bg-gradient-to-r from-emerald-500 to-emerald-600";
  }
  if (status === "in_progress") {
    return "bg-gradient-to-r from-sky-500 to-oceanBlue";
  }
  if (status === "opened_only") {
    return "bg-gradient-to-r from-amber-400 to-amber-500";
  }
  if (status === "not_started") {
    return "bg-gradient-to-r from-slate-400 to-slate-500";
  }
  return "bg-gradient-to-r from-oceanBlue to-deepBlue";
};

const formatTopicChapterProgress = (topic: TopicLearningAnalysis) => {
  if (!topic.totalChapters) return text.value.noChapterData;
  return `${topic.completedChapters}/${topic.totalChapters} ${text.value.chapters}`;
};

const formatTopicProgressSummary = (topic: TopicLearningAnalysis) => {
  if (topic.totalChapters > 0) {
    return `${topic.completedChapters} / ${topic.totalChapters} ${text.value.chaptersCompleted}`;
  }

  if (topic.progressPercent >= 85) return text.value.topicCoverageNearlyComplete;
  if (topic.progressPercent > 0) return text.value.topicActivityStarted;
  return text.value.topicNotStartedYet;
};

const getTopicRiskScore = (topic: TopicLearningAnalysis) =>
  (topic.assessmentStatus === "failed" ? 40 : 0) +
  (topic.topicStatus === "not_started" ? 30 : 0) +
  (topic.topicStatus === "opened_only" ? 20 : 0) +
  (topic.topicStatus === "in_progress" ? 10 : 0) +
  (100 - topic.progressPercent);

const sortSubjectTopicsByRisk = (topics: TopicLearningAnalysis[]) =>
  [...topics].sort((left, right) => getTopicRiskScore(right) - getTopicRiskScore(left));

const getSubjectPriorityTopics = (subject: SubjectLearningAnalysis) =>
  sortSubjectTopicsByRisk(subject.topics)
    .slice(0, 3)
    .map((topic) => topic.topicName);

const getSubjectPrioritySummary = (subject: SubjectLearningAnalysis) => {
  const topics = getSubjectPriorityTopics(subject);
  return topics.length > 0 ? topics.join(", ") : text.value.noUrgentTopicGaps;
};

const getSubjectActiveTopics = (subject: SubjectLearningAnalysis) =>
  subject.inProgressTopics + subject.openedTopics;

const isSubjectTopicListExpanded = (subjectName: string) =>
  Boolean(expandedSubjectTopics.value[subjectName]);

const toggleSubjectTopicList = (subjectName: string) => {
  expandedSubjectTopics.value = {
    ...expandedSubjectTopics.value,
    [subjectName]: !expandedSubjectTopics.value[subjectName],
  };
};

const getSubjectTopicsForDisplay = (subject: SubjectLearningAnalysis) => {
  const ordered = sortSubjectTopicsByRisk(subject.topics);
  if (isSubjectTopicListExpanded(subject.subjectName) || ordered.length <= 5) {
    return ordered;
  }
  return ordered.slice(0, 5);
};

const getSubjectHealthLabel = (subject: SubjectLearningAnalysis) => {
  if (subject.failedTopics > 0) return text.value.needsRecovery;
  if (subject.notStartedTopics > 0) return text.value.coverageGaps;
  if (getSubjectActiveTopics(subject) > 0) return text.value.buildingMomentum;
  return text.value.stable;
};

const getSubjectHealthClass = (subject: SubjectLearningAnalysis) => {
  if (subject.failedTopics > 0) return "bg-rose-100 text-rose-800";
  if (subject.notStartedTopics > 0) return "bg-amber-100 text-amber-800";
  if (getSubjectActiveTopics(subject) > 0) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-emerald-100 text-emerald-800";
};

const getTopicComparison = (topicId: string) =>
  comparisonTopicById.value.get(topicId) ?? null;

const getRecommendationOutcomeLabel = (status: string) =>
  recommendationOutcomeLabels.value[
    status as keyof typeof recommendationOutcomeLabels
  ] ?? status.replaceAll("_", " ");

const getRecommendationOutcomeClass = (status: string) => {
  if (status === "resolved") return "bg-emerald-100 text-emerald-800";
  if (status === "improved") return "bg-sky-100 text-sky-800";
  if (status === "in_progress") return "bg-amber-100 text-amber-800";
  if (status === "regressed") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
};

const formatMetricDelta = (value: number | null | undefined, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
};

const topicImprovementSummary = (topicId: string) => {
  const comparison = getTopicComparison(topicId);
  if (!comparison) return text.value.noTrackedImprovement;

  return [
    `${text.value.progress} ${formatMetricDelta(comparison.delta.progressPercent, "%")}`,
    `${text.value.quiz} ${formatMetricDelta(comparison.delta.assessmentScore, "%")}`,
    `${text.value.attempts} ${formatMetricDelta(comparison.delta.assessmentAttempts)}`,
  ].join(" | ");
};

const getTopicComparisonStatus = (topicId: string) =>
  getTopicComparison(topicId)?.status ?? "";

const getTopicComparisonAttemptCount = (topicId: string) =>
  getTopicComparison(topicId)?.quizSummarySinceSnapshot?.attemptCount ?? 0;

const buildTopicAnalysisPrompt = (topic: TopicLearningAnalysis) => {
  const scorePart =
    topic.assessmentScore !== null
      ? (isSw.value
          ? ` Alama yangu ya mwisho ya quiz ni ${topic.assessmentScore}%.`
          : ` My latest quiz score is ${topic.assessmentScore}%.`)
      : "";

  return isSw.value
    ? `Nisaidie kusoma ${topic.topicName} katika ${topic.subjectName}. Maendeleo yangu ni ${topic.progressPercent}%.${scorePart} Nionyeshe nilichoweza kufunika, nisichojafunika bado, na unipe mpango mfupi wenye maswali ya mazoezi.`
    : `Help me study ${topic.topicName} in ${topic.subjectName}. My progress is ${topic.progressPercent}%.${scorePart} Show me what I have likely covered, what I have not yet covered, and give me a short plan with practice questions.`;
};

const getSubjectSegments = (subject: SubjectLearningAnalysis) => [
  {
    label: text.value.covered,
    value: subject.coveredTopics,
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: text.value.active,
    value: getSubjectActiveTopics(subject),
    colorClass: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700",
  },
  {
    label: text.value.notStarted,
    value: subject.notStartedTopics,
    colorClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700",
  },
];
</script>

<template>
  <section
    v-if="subjects.length > 0"
    class="space-y-4"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h4 class="text-lg font-semibold text-slate-900">
          {{ text.subjectAndTopicProgress }}
        </h4>
        <p class="mt-1 text-sm text-slate-500">
          {{ text.subjectAndTopicHelper }}
        </p>
      </div>
      <p class="text-sm text-slate-500">
        {{ subjects.length }} {{ text.subjectsTracked }}
      </p>
    </div>

    <details
      v-for="subject in subjects"
      :key="subject.subjectName"
      class="overflow-hidden bg-white border rounded-[28px] border-slate-200 shadow-sm group"
    >
      <summary
        class="flex flex-col gap-4 p-4 list-none cursor-pointer sm:p-5 lg:flex-row lg:items-start lg:justify-between lg:gap-5"
      >
        <div class="min-w-0 lg:max-w-xs xl:max-w-sm">
          <div class="flex flex-wrap items-center gap-2">
            <h5 class="text-lg font-semibold tracking-tight text-slate-900">
              {{ subject.subjectName }}
            </h5>
            <span
              class="px-2.5 py-1 text-xs font-medium rounded-full"
              :class="getSubjectHealthClass(subject)"
            >
              {{ getSubjectHealthLabel(subject) }}
            </span>
          </div>

          <p class="mt-2 text-sm text-slate-500">
            {{
              [
                subject.levelName,
                `${subject.coveredTopics}/${subject.totalTopics} ${text.coveredInline}`,
                `${subject.failedTopics} ${text.failedInline}`,
              ]
                .filter(Boolean)
                .join(" | ")
            }}
          </p>

          <p class="hidden mt-3 text-xs leading-6 text-slate-500 sm:block">
            {{ text.priorityTopics }}
            <span class="font-medium text-slate-700">
              {{ getSubjectPrioritySummary(subject) }}
            </span>
          </p>
        </div>

        <div class="w-full space-y-3 sm:space-y-4 lg:flex-1">
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(14rem,0.85fr)]">
            <article class="p-4 border rounded-3xl border-slate-100 bg-slate-50/80">
              <div class="grid gap-4 sm:grid-cols-[minmax(9rem,0.72fr)_minmax(0,1fr)] sm:items-center">
                <LearningDonutChart
                  :segments="[
                    {
                      label: text.covered,
                      value: subject.coveredTopics,
                      strokeClass: 'stroke-emerald-500',
                    },
                    {
                      label: text.active,
                      value: getSubjectActiveTopics(subject),
                      strokeClass: 'stroke-sky-500',
                    },
                    {
                      label: text.notStarted,
                      value: subject.notStartedTopics,
                      strokeClass: 'stroke-slate-400',
                    },
                  ]"
                  :total="subject.totalTopics"
                  :center-primary="`${subject.coveredTopics}/${subject.totalTopics}`"
                  :center-secondary="text.coveredCenter"
                  :size="148"
                  :thickness="14"
                />

                <div>
                  <LearningDistributionBar
                    :title="text.subjectDistribution"
                    :segments="getSubjectSegments(subject)"
                    :total="subject.totalTopics"
                    :item-label="text.items"
                  />
                  <p class="mt-4 text-xs leading-6 text-slate-500">
                    {{ text.subjectDistributionSummary(getSubjectActiveTopics(subject)) }}
                  </p>
                </div>
              </div>
            </article>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <article class="p-4 border rounded-3xl border-slate-100 bg-slate-50/80">
                <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
                  {{ text.subjectProgress }}
                </p>
                <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {{ subject.averageProgress }}%
                </p>
                <div class="h-2.5 mt-4 overflow-hidden rounded-full bg-slate-200">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="getProgressBarClass('subject')"
                    :style="{ width: `${buildProgressWidth(subject.averageProgress)}%` }"
                  ></div>
                </div>
                <p class="mt-2 text-xs text-slate-500">
                  {{ text.coverageDepth }} {{ buildSubjectCoverageWidth(subject) }}%
                </p>
              </article>

              <article class="p-4 border rounded-3xl border-slate-100 bg-slate-50/80">
                <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
                  {{ text.quizAttempts }}
                </p>
                <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {{ subject.assessmentAttempts }}
                </p>
                <p class="mt-2 text-xs leading-5 text-slate-500">
                  {{ text.passedTopics }} {{ subject.passedTopics }}. {{ text.failedTopics }} {{ subject.failedTopics }}.
                </p>
              </article>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2 text-xs text-slate-600">
              <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {{ text.covered }} {{ subject.coveredTopics }}
              </span>
              <span class="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                {{ text.inProgress }} {{ getSubjectActiveTopics(subject) }}
              </span>
              <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {{ text.notStarted }} {{ subject.notStartedTopics }}
              </span>
            </div>

            <div class="flex items-center justify-center self-end w-10 h-10 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 sm:self-auto group-open:rotate-180">
              <Icon
                name="heroicons:chevron-down-20-solid"
                class="w-5 h-5"
              />
            </div>
          </div>
        </div>
      </summary>

      <div class="border-t border-slate-100 bg-slate-50/70 px-4 pb-4 sm:px-5 sm:pb-5">
        <div class="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-slate-500">
            {{ text.showingTopicDetails(subject.subjectName, subject.topics.length > 5) }}
          </p>

          <button
            v-if="subject.topics.length > 5"
            type="button"
            class="inline-flex items-center justify-center w-full gap-2 px-3 py-2 text-xs font-semibold transition-colors border rounded-full sm:w-auto border-slate-200 bg-white text-slate-700 hover:border-oceanBlue/20 hover:text-oceanBlue"
            @click.stop="toggleSubjectTopicList(subject.subjectName)"
          >
            <Icon
              :name="
                isSubjectTopicListExpanded(subject.subjectName)
                  ? 'heroicons:minus-small'
                  : 'heroicons:plus-small'
              "
              class="w-4 h-4"
            />
            <span>
              {{
                isSubjectTopicListExpanded(subject.subjectName)
                  ? text.showTop5Only
                  : text.showAllTopics(subject.topics.length)
              }}
            </span>
          </button>
        </div>

        <div class="space-y-3 md:max-h-[32rem] md:overflow-y-auto md:pr-1">
          <article
            v-for="topic in getSubjectTopicsForDisplay(subject)"
            :key="topic.topicId"
            class="flex flex-col gap-4 p-4 bg-white border rounded-2xl border-slate-200 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="px-2.5 py-1 text-xs font-medium rounded-full"
                  :class="getTopicStatusClass(topic.topicStatus)"
                >
                  {{ formatTopicStatus(topic.topicStatus) }}
                </span>
                <span
                  class="px-2.5 py-1 text-xs font-medium rounded-full"
                  :class="getAssessmentStatusClass(topic.assessmentStatus)"
                >
                  {{ formatAssessmentStatus(topic.assessmentStatus) }}
                </span>
              </div>

              <h6 class="mt-3 text-sm font-semibold text-slate-900">
                {{ topic.topicName }}
              </h6>

              <div class="flex flex-wrap gap-2 mt-3 text-xs text-slate-600">
                <span class="px-2.5 py-1 rounded-full bg-slate-100">
                  {{ text.progress }} {{ topic.progressPercent }}%
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100">
                  {{ formatTopicChapterProgress(topic) }}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100">
                  {{ text.attempts }} {{ topic.assessmentAttempts }}
                </span>
                <span
                  v-if="topic.assessmentScore !== null"
                  class="px-2.5 py-1 rounded-full bg-slate-100"
                >
                  {{ text.quiz }} {{ topic.assessmentScore }}%
                </span>
              </div>

              <div class="mt-4">
                <div class="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span class="font-semibold tracking-wide uppercase">{{ text.topicProgress }}</span>
                  <span>{{ buildProgressWidth(topic.progressPercent) }}%</span>
                </div>
                <div class="h-2.5 mt-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full transition-all duration-500 rounded-full"
                    :class="getProgressBarClass(topic.topicStatus)"
                    :style="{ width: `${buildProgressWidth(topic.progressPercent)}%` }"
                  ></div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-slate-500">
                  <span>{{ formatTopicProgressSummary(topic) }}</span>
                  <span>{{ formatTopicChapterProgress(topic) }}</span>
                </div>
              </div>

              <div
                v-if="getTopicComparison(topic.topicId)"
                class="p-4 mt-4 border rounded-2xl border-sky-100 bg-sky-50/70"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-xs font-semibold tracking-wide uppercase text-oceanBlue">
                      {{ text.sinceSnapshot }}
                    </p>
                    <span
                      class="px-2.5 py-1 text-xs font-medium rounded-full"
                      :class="getRecommendationOutcomeClass(getTopicComparisonStatus(topic.topicId))"
                    >
                      {{
                        getRecommendationOutcomeLabel(
                          getTopicComparisonStatus(topic.topicId),
                        )
                      }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-500">
                    {{ text.attemptsSinceSnapshot }}
                    {{ getTopicComparisonAttemptCount(topic.topicId) }}
                  </p>
                </div>

                <div class="flex flex-col gap-3 mt-3 md:flex-row md:items-center md:justify-between">
                  <p class="text-sm text-slate-700">
                    {{ topicImprovementSummary(topic.topicId) }}
                  </p>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold transition-colors border rounded-full border-oceanBlue/20 bg-white text-oceanBlue hover:bg-oceanBlue/5"
                    @click="emit('open-improvement', topic.topicId)"
                  >
                    <Icon
                      name="heroicons:chart-bar-square"
                      class="w-4 h-4"
                    />
                    <span>{{ text.viewImprovement }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <NuxtLink
                :to="topic.revisitPath"
                class="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold transition-colors border rounded-xl sm:w-auto border-oceanBlue/20 text-oceanBlue hover:bg-oceanBlue/5"
              >
                <Icon
                  name="heroicons:play-circle"
                  class="w-5 h-5"
                />
                <span>{{ text.openTopic }}</span>
              </NuxtLink>

              <button
                type="button"
                class="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl sm:w-auto bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
                @click="emit('open-ai', buildTopicAnalysisPrompt(topic))"
              >
                <Icon
                  name="heroicons:sparkles"
                  class="w-5 h-5"
                />
                <span>{{ text.analyzeWithAi }}</span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </details>
  </section>
</template>
