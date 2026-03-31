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

const topicStatusLabels: Record<TopicLearningStatus, string> = {
  covered: "Covered",
  in_progress: "In progress",
  opened_only: "Opened only",
  not_started: "Not started",
};

const assessmentStatusLabels: Record<TopicAssessmentStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  not_attempted: "Not attempted",
};

const recommendationOutcomeLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  improved: "Improved",
  resolved: "Resolved",
  regressed: "Regressed",
} as const;

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
  topicStatusLabels[status] ?? status.replaceAll("_", " ");

const formatAssessmentStatus = (status: TopicAssessmentStatus) =>
  assessmentStatusLabels[status] ?? status.replaceAll("_", " ");

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
  if (!topic.totalChapters) return "No chapter data";
  return `${topic.completedChapters}/${topic.totalChapters} chapters`;
};

const formatTopicProgressSummary = (topic: TopicLearningAnalysis) => {
  if (topic.totalChapters > 0) {
    return `${topic.completedChapters} of ${topic.totalChapters} chapters completed`;
  }

  if (topic.progressPercent >= 85) return "Topic coverage is nearly complete";
  if (topic.progressPercent > 0) return "Topic activity has started";
  return "Topic not started yet";
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
  return topics.length > 0 ? topics.join(", ") : "No urgent topic gaps";
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
  if (subject.failedTopics > 0) return "Needs recovery";
  if (subject.notStartedTopics > 0) return "Coverage gaps";
  if (getSubjectActiveTopics(subject) > 0) return "Building momentum";
  return "Stable";
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
  recommendationOutcomeLabels[
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
  if (!comparison) return "No tracked improvement yet";

  return [
    `Progress ${formatMetricDelta(comparison.delta.progressPercent, "%")}`,
    `Quiz ${formatMetricDelta(comparison.delta.assessmentScore, "%")}`,
    `Attempts ${formatMetricDelta(comparison.delta.assessmentAttempts)}`,
  ].join(" | ");
};

const getTopicComparisonStatus = (topicId: string) =>
  getTopicComparison(topicId)?.status ?? "";

const getTopicComparisonAttemptCount = (topicId: string) =>
  getTopicComparison(topicId)?.quizSummarySinceSnapshot?.attemptCount ?? 0;

const buildTopicAnalysisPrompt = (topic: TopicLearningAnalysis) => {
  const scorePart =
    topic.assessmentScore !== null
      ? ` My latest quiz score is ${topic.assessmentScore}%.`
      : "";

  return `Help me study ${topic.topicName} in ${topic.subjectName}. My progress is ${topic.progressPercent}%.${scorePart} Show me what I have likely covered, what I have not yet covered, and give me a short plan with practice questions.`;
};

const getSubjectSegments = (subject: SubjectLearningAnalysis) => [
  {
    label: "Covered",
    value: subject.coveredTopics,
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Active",
    value: getSubjectActiveTopics(subject),
    colorClass: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700",
  },
  {
    label: "Not started",
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
          Subject And Topic Progress
        </h4>
        <p class="mt-1 text-sm text-slate-500">
          Each subject now leads with a visual breakdown before the detailed topic list.
        </p>
      </div>
      <p class="text-sm text-slate-500">
        {{ subjects.length }} subjects tracked
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
                `${subject.coveredTopics}/${subject.totalTopics} covered`,
                `${subject.failedTopics} failed`,
              ]
                .filter(Boolean)
                .join(" | ")
            }}
          </p>

          <p class="hidden mt-3 text-xs leading-6 text-slate-500 sm:block">
            Priority topics:
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
                      label: 'Covered',
                      value: subject.coveredTopics,
                      strokeClass: 'stroke-emerald-500',
                    },
                    {
                      label: 'Active',
                      value: getSubjectActiveTopics(subject),
                      strokeClass: 'stroke-sky-500',
                    },
                    {
                      label: 'Not started',
                      value: subject.notStartedTopics,
                      strokeClass: 'stroke-slate-400',
                    },
                  ]"
                  :total="subject.totalTopics"
                  :center-primary="`${subject.coveredTopics}/${subject.totalTopics}`"
                  center-secondary="covered"
                  :size="148"
                  :thickness="14"
                />

                <div>
                  <LearningDistributionBar
                    title="Subject distribution"
                    :segments="getSubjectSegments(subject)"
                    :total="subject.totalTopics"
                  />
                  <p class="mt-4 text-xs leading-6 text-slate-500">
                    Active work is concentrated in {{ getSubjectActiveTopics(subject) }}
                    topics right now.
                  </p>
                </div>
              </div>
            </article>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <article class="p-4 border rounded-3xl border-slate-100 bg-slate-50/80">
                <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
                  Subject progress
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
                  Coverage depth {{ buildSubjectCoverageWidth(subject) }}%
                </p>
              </article>

              <article class="p-4 border rounded-3xl border-slate-100 bg-slate-50/80">
                <p class="text-xs font-semibold tracking-[0.24em] uppercase text-slate-500">
                  Quiz attempts
                </p>
                <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {{ subject.assessmentAttempts }}
                </p>
                <p class="mt-2 text-xs leading-5 text-slate-500">
                  Passed topics {{ subject.passedTopics }}. Failed topics {{ subject.failedTopics }}.
                </p>
              </article>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2 text-xs text-slate-600">
              <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Covered {{ subject.coveredTopics }}
              </span>
              <span class="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                In progress {{ getSubjectActiveTopics(subject) }}
              </span>
              <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Not started {{ subject.notStartedTopics }}
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
            Showing topic-level details for {{ subject.subjectName }}.
            {{
              subject.topics.length > 5
                ? " By default, only the 5 highest-risk topics are shown first."
                : ""
            }}
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
                  ? "Show top 5 only"
                  : `Show all ${subject.topics.length} topics`
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
                  Progress {{ topic.progressPercent }}%
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100">
                  {{ formatTopicChapterProgress(topic) }}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100">
                  Attempts {{ topic.assessmentAttempts }}
                </span>
                <span
                  v-if="topic.assessmentScore !== null"
                  class="px-2.5 py-1 rounded-full bg-slate-100"
                >
                  Quiz {{ topic.assessmentScore }}%
                </span>
              </div>

              <div class="mt-4">
                <div class="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span class="font-semibold tracking-wide uppercase">Topic progress</span>
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
                      Since Recommendation Snapshot
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
                    Attempts since snapshot:
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
                    <span>View improvement</span>
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
                <span>Open Topic</span>
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
                <span>Analyze with AI</span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </details>
  </section>
</template>
