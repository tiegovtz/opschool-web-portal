<script setup lang="ts">
import MarkdownIt from "markdown-it";
import apiDocs from "~/utilities/apiDocs";
import type {
  PersonalizedRecommendationsResponse,
  RecommendationAction,
  SubjectLearningAnalysis,
  TalkToDataResponse,
  TopicAssessmentStatus,
  TopicLearningAnalysis,
  TopicLearningStatus,
} from "~/types/recommendation.interface";

type Status = "idle" | "pending" | "loading" | "success" | "error";

const signInAccessToken = useCookie<string>("signInAccessToken");
const route = useRoute();
const router = useRouter();
const tieOverlayOpen = useState<boolean>("tie-ai-overlay-open", () => false);
const tieOverlayOpening = useState<boolean>(
  "tie-ai-overlay-opening",
  () => false,
);
const tieOverlayBackground = useState<string>(
  "tie-ai-overlay-background",
  () => "",
);
const tieOverlayPushed = useState<boolean>(
  "tie-ai-overlay-pushed",
  () => false,
);
const { setDraft: setAiTeacherDraft } = useAiTeacherDraft();

const { data: profileData, status } = await useFetch<any>(
  apiDocs.auth.profile,
  {
    headers: {
      Authorization: `Bearer ${signInAccessToken.value}`,
    },
  },
);

const {
  data: personalizedRecommendations,
  status: recommendationStatus,
  error: recommendationError,
} = await useFetch<PersonalizedRecommendationsResponse>(
  "/api/recommendations/personalized",
);

const recommendationCards = computed(
  () => personalizedRecommendations.value?.recommendations ?? [],
);
const recommendationOverview = computed(
  () => personalizedRecommendations.value?.overview ?? null,
);
const subjectBreakdown = computed(
  () => personalizedRecommendations.value?.subjectBreakdown ?? [],
);
const talkToDataQuestion = ref("");
const talkToDataAnswer = ref("");
const talkToDataError = ref("");
const talkToDataGeneratedAt = ref("");
const talkToDataStatus = ref<Status>("idle");
const expandedSubjectTopics = ref<Record<string, boolean>>({});
const talkToDataPrompts = [
  "Which topics have I not covered yet?",
  "Which subject is my weakest right now?",
  "Show me the topics where I am failing.",
  "What should I revise before the teacher reviews me?",
];
const talkToDataMarkdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

const actionLabels: Record<RecommendationAction, string> = {
  start_topic: "Start topic",
  rewatch_video: "Rewatch video",
  review_notes: "Review notes",
  practice_quiz: "Practice quiz",
};

const actionHelperLabels: Record<RecommendationAction, string> = {
  start_topic: "Start topic",
  rewatch_video: "Revisit lesson",
  review_notes: "Open topic notes",
  practice_quiz: "Review then practice",
};

const reasonLabels: Record<string, string> = {
  not_started: "Not started",
  low_progress: "Low progress",
  low_assessment: "Low assessment",
  started_not_finished: "Started, not finished",
  needs_practice: "Needs practice",
};

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

const formatRecommendationAction = (action: RecommendationAction) =>
  actionLabels[action] ?? action.replaceAll("_", " ");

const formatRecommendationActionHelper = (action: RecommendationAction) =>
  actionHelperLabels[action] ?? "Open topic";

const formatReasonCode = (reasonCode: string) =>
  reasonLabels[reasonCode] ?? reasonCode.replaceAll("_", " ");

const formatTopicStatus = (status: TopicLearningStatus) =>
  topicStatusLabels[status] ?? status.replaceAll("_", " ");

const formatAssessmentStatus = (status: TopicAssessmentStatus) =>
  assessmentStatusLabels[status] ?? status.replaceAll("_", " ");

const getTopicStatusClass = (status: TopicLearningStatus) => {
  if (status === "covered") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "in_progress") {
    return "bg-sky-100 text-sky-800";
  }
  if (status === "opened_only") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
};

const getAssessmentStatusClass = (status: TopicAssessmentStatus) => {
  if (status === "passed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "failed") {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-slate-100 text-slate-700";
};

const buildSubjectCoverageWidth = (subject: SubjectLearningAnalysis) => {
  if (!subject.totalTopics) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((subject.coveredTopics / subject.totalTopics) * 100),
    ),
  );
};

const formatTopicChapterProgress = (topic: TopicLearningAnalysis) => {
  if (!topic.totalChapters) return "No chapter data";
  return `${topic.completedChapters}/${topic.totalChapters} chapters`;
};

const buildTopicAnalysisPrompt = (topic: TopicLearningAnalysis) => {
  const scorePart =
    topic.assessmentScore !== null
      ? ` My latest quiz score is ${topic.assessmentScore}%.`
      : "";

  return `Help me study ${topic.topicName} in ${topic.subjectName}. My progress is ${topic.progressPercent}%.${scorePart} Show me what I have likely covered, what I have not yet covered, and give me a short plan with practice questions.`;
};

const renderTalkToDataAnswer = (value: string) => {
  if (!value.trim()) return "";
  return talkToDataMarkdown.render(value);
};

const formatGeneratedAt = (value: string) => {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const askTalkToData = async (presetQuestion?: string) => {
  const resolvedQuestion = (presetQuestion ?? talkToDataQuestion.value).trim();
  if (!resolvedQuestion) {
    talkToDataStatus.value = "error";
    talkToDataError.value = "Ask a question about your own learning data.";
    return;
  }

  talkToDataQuestion.value = resolvedQuestion;
  talkToDataStatus.value = "loading";
  talkToDataError.value = "";

  try {
    const response = await $fetch<TalkToDataResponse>(
      "/api/profile/talk-to-data",
      {
        method: "POST",
        body: {
          question: resolvedQuestion,
        },
      },
    );

    talkToDataAnswer.value = response.answer;
    talkToDataGeneratedAt.value = response.generatedAt;
    talkToDataStatus.value = "success";
  } catch (error: any) {
    talkToDataStatus.value = "error";
    talkToDataError.value =
      error?.data?.message ||
      error?.message ||
      "Failed to analyze your learning data right now.";
  }
};

const getTopicRiskScore = (topic: TopicLearningAnalysis) => {
  return (
    (topic.assessmentStatus === "failed" ? 40 : 0) +
    (topic.topicStatus === "not_started" ? 30 : 0) +
    (topic.topicStatus === "opened_only" ? 20 : 0) +
    (topic.topicStatus === "in_progress" ? 10 : 0) +
    (100 - topic.progressPercent)
  );
};

const sortSubjectTopicsByRisk = (topics: TopicLearningAnalysis[]) => {
  return [...topics].sort((left, right) => {
    return getTopicRiskScore(right) - getTopicRiskScore(left);
  });
};

const getSubjectPriorityTopics = (subject: SubjectLearningAnalysis) => {
  return sortSubjectTopicsByRisk(subject.topics)
    .slice(0, 3)
    .map((topic) => topic.topicName);
};

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
  if (subject.failedTopics > 0) return "Needs attention";
  if (subject.notStartedTopics > 0) return "Has gaps";
  if (subject.inProgressTopics + subject.openedTopics > 0) return "In progress";
  return "Strong";
};

const getSubjectHealthClass = (subject: SubjectLearningAnalysis) => {
  if (subject.failedTopics > 0) return "bg-rose-100 text-rose-800";
  if (subject.notStartedTopics > 0) return "bg-amber-100 text-amber-800";
  if (subject.inProgressTopics + subject.openedTopics > 0) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-emerald-100 text-emerald-800";
};

const openAiTeacherWithPrompt = async (seedPrompt: string) => {
  if (!seedPrompt.trim()) return;

  setAiTeacherDraft(seedPrompt);
  tieOverlayOpening.value = true;

  try {
    tieOverlayBackground.value = route.fullPath;
    tieOverlayPushed.value = true;
    await router.push({
      query: {
        ...route.query,
        overlay: "1",
      },
      state: {
        aiOverlay: true,
        aiOverlayBackground: route.fullPath,
      },
    });
    tieOverlayOpen.value = true;
  } finally {
    tieOverlayOpening.value = false;
  }
};
</script>

<template>
  <div
    v-if="status == 'pending'"
    class="flex items-center justify-center w-full"
  >
    <LoadingIndicator :is-loading="true" />
  </div>

  <div
    v-else-if="status == 'success'"
    class="flex flex-col w-full gap-6"
  >
    <div
      class="w-full overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200"
    >
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">Learning Statistics</h3>
      </div>
      <div
        class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5"
      >
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-blue-100 text-deepBlue">
            <Icon
              name="fa6-solid:book-open-reader"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Competences Opened</span>
            <span class="profile-stat-value">{{
              profileData?.totalTopicsOpened ?? 0
            }}</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-green-100 text-emerald-700">
            <Icon
              name="heroicons:folder-open-20-solid"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Subject Opened</span>
            <span class="profile-stat-value">{{
              profileData?.openedSubjects ?? 0
            }}</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-red-100 text-red-600">
            <Icon
              name="stash:clock-solid"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Time Spent</span>
            <span class="profile-stat-value">{{
              profileData?.timeSpentFormatted ?? "0h 0m"
            }}</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-purple-100 text-purple-600">
            <Icon
              name="solar:notebook-bold"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Quiz Attempts</span>
            <span class="profile-stat-value">{{
              profileData?.questionStats?.totalAttempted != null
                ? Number(profileData.questionStats.totalAttempted).toFixed(0)
                : "0"
            }}</span>
          </div>
        </div>

        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-indigo-100 text-indigo-600">
            <Icon
              name="heroicons:chart-bar-16-solid"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Average Quiz Score</span>
            <span class="profile-stat-value"
              >{{
                profileData?.questionStats?.averageScore != null
                  ? Number(profileData.questionStats.averageScore).toFixed(1)
                  : "—"
              }}%</span
            >
          </div>
        </div>
      </div>

      <div
        v-if="recommendationStatus === 'pending'"
        class="p-6 space-y-4 bg-[#f8fbfd]"
      >
        <div class="w-2/3 h-4 rounded bg-slate-200 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
      </div>

      <div
        v-else-if="recommendationError"
        class="p-6 bg-[#f8fbfd]"
      >
        <div
          class="p-4 border border-amber-200 rounded-2xl bg-amber-50 text-amber-900"
        >
          <p class="font-medium">
            Personalized recommendations are temporarily unavailable.
          </p>
          <p class="mt-1 text-sm">
            Your profile data is still available. Try refreshing the page in a
            moment.
          </p>
        </div>
      </div>

      <div
        v-else-if="!recommendationOverview && recommendationCards.length === 0"
        class="p-6 bg-[#f8fbfd]"
      >
        <div class="p-5 border border-emerald-100 rounded-3xl bg-emerald-50/80">
          <p class="font-medium text-emerald-900">
            {{
              personalizedRecommendations?.summary ||
              "You are keeping up well with your recent topics."
            }}
          </p>
          <p class="mt-2 text-sm text-emerald-800">
            Keep reviewing your latest lessons and continue with the next topic
            in your current subject.
          </p>
        </div>
      </div>

      <div
        v-else
        class="p-6 space-y-5 bg-[#f8fbfd]"
      >
        <div class="p-5 border border-sky-100 rounded-3xl bg-white shadow-sm">
          <p class="text-sm leading-6 text-slate-700">
            {{ personalizedRecommendations?.summary }}
          </p>
        </div>

        <div
          v-if="recommendationOverview"
          class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <div class="p-4 bg-white border rounded-3xl border-slate-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-slate-500"
            >
              Total Topics
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ recommendationOverview.totalTopics }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-emerald-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-emerald-700"
            >
              Covered
            </p>
            <p class="mt-2 text-2xl font-semibold text-emerald-900">
              {{ recommendationOverview.coveredTopics }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-sky-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-sky-700"
            >
              In Progress
            </p>
            <p class="mt-2 text-2xl font-semibold text-sky-900">
              {{
                recommendationOverview.inProgressTopics +
                recommendationOverview.openedTopics
              }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-slate-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-slate-500"
            >
              Not Started
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ recommendationOverview.notStartedTopics }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-amber-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-amber-700"
            >
              Quiz Status
            </p>
            <p class="mt-2 text-2xl font-semibold text-amber-900">
              {{ recommendationOverview.passedTopics }}/{{
                recommendationOverview.failedTopics
              }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Passed / Failed topics</p>
          </div>
        </div>

        <section
          v-if="recommendationOverview"
          class="p-5 bg-white border rounded-3xl border-slate-200 shadow-sm"
        >
          <div
            class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
          >
            <div>
              <h4 class="text-lg font-semibold text-slate-900">
                Deep Learner Analysis
              </h4>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                Full syllabus view for the student level: covered topics,
                untouched topics, started work, and assessment outcomes.
              </p>
            </div>

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">Average progress</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ recommendationOverview.averageProgress }}%
                </p>
              </div>
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">
                  Assessment average
                </p>
                <p class="text-sm font-semibold text-slate-900">
                  {{
                    recommendationOverview.averageAssessmentScore !== null
                      ? `${recommendationOverview.averageAssessmentScore}%`
                      : "No quiz data"
                  }}
                </p>
              </div>
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">Subjects opened</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ recommendationOverview.subjectsOpened }}/{{
                    recommendationOverview.totalSubjects
                  }}
                </p>
              </div>
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">Quiz attempts</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ recommendationOverview.totalAssessmentAttempts }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          class="p-5 bg-white border rounded-3xl border-slate-200 shadow-sm"
        >
          <div
            class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h4 class="text-lg font-semibold text-slate-900">
                Talk To Your Data
              </h4>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                Ask questions about your own learning record: covered topics,
                weak areas, failed quizzes, unfinished work, and what to revise
                next.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="prompt in talkToDataPrompts"
                :key="prompt"
                type="button"
                class="px-3 py-2 text-xs font-medium transition-colors border rounded-full border-oceanBlue/15 bg-oceanBlue/5 text-oceanBlue hover:bg-oceanBlue/10"
                @click="askTalkToData(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <div class="mt-5 space-y-4">
            <label
              for="talk-to-data-input"
              class="block text-sm font-medium text-slate-700"
            >
              Ask about your learning data
            </label>
            <textarea
              id="talk-to-data-input"
              v-model="talkToDataQuestion"
              rows="4"
              class="w-full px-4 py-3 text-sm transition-colors border rounded-2xl resize-y border-slate-200 bg-slate-50 focus:border-oceanBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/20"
              placeholder="Example: Which topics have I not covered yet, and where am I failing?"
            ></textarea>

            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-xs text-slate-500">
                The answer is grounded in your profile progress, topic coverage,
                and assessment data.
              </p>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="talkToDataStatus === 'loading'"
                @click="askTalkToData()"
              >
                <Icon
                  name="heroicons:chart-bar-square"
                  class="w-5 h-5"
                />
                <span>
                  {{
                    talkToDataStatus === "loading"
                      ? "Analyzing..."
                      : "Ask Your Data"
                  }}
                </span>
              </button>
            </div>

            <div
              v-if="talkToDataStatus === 'error'"
              class="p-4 border rounded-2xl border-rose-200 bg-rose-50 text-rose-800"
            >
              <p class="text-sm font-medium">
                {{ talkToDataError }}
              </p>
            </div>

            <div
              v-else-if="talkToDataStatus === 'success' && talkToDataAnswer"
              class="p-5 border rounded-2xl border-sky-100 bg-sky-50/70"
            >
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <p
                  class="text-xs font-semibold tracking-wide uppercase text-oceanBlue"
                >
                  Answer From Your Learning Data
                </p>
                <p
                  v-if="talkToDataGeneratedAt"
                  class="text-xs text-slate-500"
                >
                  {{ formatGeneratedAt(talkToDataGeneratedAt) }}
                </p>
              </div>

              <div
                class="mt-3 prose prose-sm max-w-none text-slate-700 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-strong:font-semibold prose-headings:text-slate-900"
                v-html="renderTalkToDataAnswer(talkToDataAnswer)"
              ></div>
            </div>
          </div>
        </section>

        <section
          v-if="subjectBreakdown.length > 0"
          class="space-y-4"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-semibold text-slate-900">
              Subject Breakdown
            </h4>
            <p class="text-sm text-slate-500">
              Coverage and performance by subject
            </p>
          </div>

          <details
            v-for="subject in subjectBreakdown"
            :key="subject.subjectName"
            class="overflow-hidden bg-white border rounded-3xl border-slate-200 shadow-sm group"
          >
            <summary
              class="flex flex-col gap-4 p-5 list-none cursor-pointer lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h5 class="text-base font-semibold text-slate-900">
                    {{ subject.subjectName }}
                  </h5>
                  <span
                    class="px-2.5 py-1 text-xs font-medium rounded-full"
                    :class="getSubjectHealthClass(subject)"
                  >
                    {{ getSubjectHealthLabel(subject) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-slate-500">
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
                <p class="mt-2 text-xs leading-5 text-slate-500">
                  Priority topics:
                  {{
                    getSubjectPriorityTopics(subject).join(", ") ||
                    "No urgent topic gaps"
                  }}
                </p>
              </div>

              <div class="w-full max-w-xl">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex justify-between text-xs text-slate-500">
                      <span>Coverage</span>
                      <span>{{ buildSubjectCoverageWidth(subject) }}%</span>
                    </div>
                    <div
                      class="h-2 mt-2 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        class="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-oceanBlue to-deepBlue"
                        :style="{
                          width: `${buildSubjectCoverageWidth(subject)}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 group-open:rotate-180"
                  >
                    <Icon
                      name="heroicons:chevron-down-20-solid"
                      class="w-5 h-5"
                    />
                  </div>
                </div>
                <div
                  class="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 sm:grid-cols-4"
                >
                  <span
                    class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700"
                  >
                    Covered {{ subject.coveredTopics }}
                  </span>
                  <span class="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                    In progress
                    {{ subject.inProgressTopics + subject.openedTopics }}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
                  >
                    Not started {{ subject.notStartedTopics }}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700"
                  >
                    Quiz attempts {{ subject.assessmentAttempts }}
                  </span>
                </div>
              </div>
            </summary>

            <div class="px-5 pb-5 border-t border-slate-100 bg-slate-50/70">
              <div
                class="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p class="text-xs text-slate-500">
                  Showing topic-level details for {{ subject.subjectName }}.
                  {{
                    subject.topics.length > 5
                      ? `By default, only the 5 highest-risk topics are shown first.`
                      : ""
                  }}
                </p>

                <button
                  v-if="subject.topics.length > 5"
                  type="button"
                  class="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold transition-colors border rounded-full border-slate-200 bg-white text-slate-700 hover:border-oceanBlue/20 hover:text-oceanBlue"
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
              <div class="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                <article
                  v-for="topic in getSubjectTopicsForDisplay(subject)"
                  :key="topic.topicId"
                  class="flex flex-col gap-4 p-4 bg-white border rounded-2xl border-slate-200 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="px-2.5 py-1 text-xs font-medium rounded-full"
                        :class="getTopicStatusClass(topic.topicStatus)"
                      >
                        {{ formatTopicStatus(topic.topicStatus) }}
                      </span>
                      <span
                        class="px-2.5 py-1 text-xs font-medium rounded-full"
                        :class="
                          getAssessmentStatusClass(topic.assessmentStatus)
                        "
                      >
                        {{ formatAssessmentStatus(topic.assessmentStatus) }}
                      </span>
                    </div>

                    <h6 class="mt-3 text-sm font-semibold text-slate-900">
                      {{ topic.topicName }}
                    </h6>

                    <div
                      class="flex flex-wrap gap-2 mt-3 text-xs text-slate-600"
                    >
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
                  </div>

                  <div class="flex flex-col gap-3 sm:flex-row">
                    <NuxtLink
                      :to="topic.revisitPath"
                      class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border rounded-xl border-oceanBlue/20 text-oceanBlue hover:bg-oceanBlue/5"
                    >
                      <Icon
                        name="heroicons:play-circle"
                        class="w-5 h-5"
                      />
                      <span>Open Topic</span>
                    </NuxtLink>

                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
                      @click="
                        openAiTeacherWithPrompt(buildTopicAnalysisPrompt(topic))
                      "
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

        <div
          v-if="recommendationCards.length === 0"
          class="p-5 border border-emerald-100 rounded-3xl bg-emerald-50/80"
        >
          <p class="font-medium text-emerald-900">
            No urgent revision topics were found right now.
          </p>
          <p class="mt-2 text-sm text-emerald-800">
            Use the breakdown above to keep reviewing untouched or partially
            completed topics before the teacher checks your progress.
          </p>
        </div>

        <article
          v-for="recommendation in recommendationCards"
          :key="recommendation.topicId"
          class="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-3xl"
        >
          <NuxtLink
            :to="recommendation.revisitPath"
            class="block p-5 transition-all duration-300 group hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
          >
            <div
              class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-slate-100 text-slate-600"
                  >
                    <Icon
                      name="fa6-solid:book-open-reader"
                      class="w-3.5 h-3.5"
                    />
                    Revisit Compitence
                  </span>
                  <span
                    class="px-2.5 py-1 text-xs font-semibold rounded-full bg-oceanBlue/10 text-oceanBlue"
                  >
                    {{
                      formatRecommendationAction(
                        recommendation.recommendedAction,
                      )
                    }}
                  </span>
                </div>

                <h4
                  class="mt-3 text-lg font-semibold text-slate-900 group-hover:text-deepBlue"
                >
                  {{ recommendation.topicName }}
                </h4>

                <p class="mt-4 text-sm leading-6 text-slate-700">
                  {{ recommendation.explanation }}
                </p>

                <div
                  class="p-4 mt-4 border rounded-2xl border-sky-100 bg-sky-50/80"
                >
                  <p
                    class="text-xs font-semibold tracking-wide uppercase text-oceanBlue"
                  >
                    Focus when revisiting
                  </p>
                  <p class="mt-2 text-sm leading-6 text-slate-700">
                    {{ recommendation.attainmentFocus }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2 mt-4">
                  <span
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                  >
                    Progress {{ recommendation.progressPercent }}%
                  </span>
                  <span
                    v-if="recommendation.assessmentScore !== null"
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                  >
                    Quiz {{ recommendation.assessmentScore }}%
                  </span>
                  <span
                    v-for="reasonCode in recommendation.reasonCodes"
                    :key="reasonCode"
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800"
                  >
                    {{ formatReasonCode(reasonCode) }}
                  </span>
                </div>
              </div>

              <div
                class="flex items-center gap-2 text-sm font-semibold text-oceanBlue group-hover:text-deepBlue"
              >
                <span>{{
                  formatRecommendationActionHelper(
                    recommendation.recommendedAction,
                  )
                }}</span>
                <Icon
                  name="heroicons:arrow-right-20-solid"
                  class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
            </div>
          </NuxtLink>

          <div
            class="flex flex-col gap-3 px-5 py-4 border-t border-slate-200 bg-white sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-sm text-slate-500">
              Open the topic directly or ask AI Teacher to guide your revision.
            </p>

            <div class="flex flex-col gap-3 sm:flex-row">
              <NuxtLink
                :to="recommendation.revisitPath"
                class="inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-colors border rounded-xl border-oceanBlue/20 text-oceanBlue hover:bg-oceanBlue/5"
              >
                <Icon
                  name="heroicons:play-circle"
                  class="w-5 h-5"
                />
                <span>Open Compitence</span>
              </NuxtLink>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
                @click="openAiTeacherWithPrompt(recommendation.seedPrompt)"
              >
                <Icon
                  name="heroicons:sparkles"
                  class="w-5 h-5"
                />
                <span>Study with AI Teacher</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div
      v-if="profileData?.recentTopics?.length > 0"
      class="w-full overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200"
    >
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">
          Learning Topics Statistics
        </h3>
      </div>
      <div
        class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5"
      >
        <HomeTopicCard
          v-for="topic in profileData.recentTopics"
          :key="topic?._id"
          :topic-id="topic?._id"
          :topic-image="topic?.thumbnail"
          :topic-title="topic?.name"
          :topic-description="topic?.descriptions"
          :topic-duration="
            topic?.topic_duration ? topic?.topic_duration : '10 min'
          "
          :topic-likes="topic?.topic_likes ? topic?.topic_likes : 100"
          :topic-views="
            topic?.viewedBy?.length
              ? topic?.viewedBy?.length
              : topic?.views
                ? topic?.views
                : 0
          "
          topic-level="lower secondary"
          :topic-standard="topic?.level?.name"
          :subject-name="topic?.subject?.name"
          :topic-viewed="topic?.isViewed"
          :topic-progress="topic?.progress?.avgProgress"
          model-type="profile"
        />
      </div>
    </div>
  </div>

  <div
    v-else-if="status == 'error'"
    class="flex items-center justify-center w-full"
  >
    <MessagePageNotFound />
  </div>

  <div
    v-else
    class="flex items-center justify-center w-full"
  >
    <p class="text-center text-medium">
      Try to refresh the page, Something went Wrong
    </p>
  </div>
</template>

<style scoped>
.profile-stat-card {
  @apply flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 transition-colors hover:bg-slate-100/80;
}

.profile-stat-icon {
  @apply flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0;
}

.profile-stat-content {
  @apply flex flex-col items-center sm:items-start min-w-0;
}

.profile-stat-label {
  @apply text-xs font-medium text-slate-500 leading-tight;
}

.profile-stat-value {
  @apply text-base font-bold text-slate-800 mt-0.5 tabular-nums;
}
</style>
