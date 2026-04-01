<script setup lang="ts">
import MarkdownIt from "markdown-it";
import LearningMetricCard from "@/components/profile/learning-statistics/LearningMetricCard.vue";
import LearningOverviewHero from "@/components/profile/learning-statistics/LearningOverviewHero.vue";
import LearningSubjectBreakdown from "@/components/profile/learning-statistics/LearningSubjectBreakdown.vue";
import apiDocs from "~/utilities/apiDocs";
import type {
  PersonalizedRecommendationsResponse,
  RecommendationAction,
  RecommendationProgressSummaryResponse,
  RecommendationSnapshotComparisonResponse,
  RecommendationSnapshotCreateResponse,
  TalkToDataResponse,
} from "~/types/recommendation.interface";

type Status = "idle" | "pending" | "loading" | "success" | "error";

const signInAccessToken = useCookie<string>("signInAccessToken");
const pageLanguage = useHubPageLanguage();
const isSw = computed(() => pageLanguage.value === "kiswahili");
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
const {
  snapshotId: activeRecommendationSnapshotId,
  generatedAt: activeRecommendationSnapshotGeneratedAt,
  setActiveSnapshot,
  clearActiveSnapshot,
} = useRecommendationSnapshot();

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
const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};
const displayQuizAttempts = computed(() => {
  const recommendationAttempts = toFiniteNumber(
    recommendationOverview.value?.totalAssessmentAttempts,
  );
  const profileAttempts = toFiniteNumber(
    profileData.value?.questionStats?.totalAttempted,
  );
  const resolvedAttempts = Math.max(
    recommendationAttempts ?? 0,
    profileAttempts ?? 0,
  );

  return resolvedAttempts.toFixed(0);
});
const displayAverageQuizScore = computed(() => {
  const recommendationScore = toFiniteNumber(
    recommendationOverview.value?.averageAssessmentScore,
  );
  if (recommendationScore !== null) {
    return recommendationScore.toFixed(1);
  }

  const profileScore = toFiniteNumber(profileData.value?.questionStats?.averageScore);
  return profileScore !== null ? profileScore.toFixed(1) : "—";
});
const topicBreakdown = computed(
  () => personalizedRecommendations.value?.topicBreakdown ?? [],
);
const subjectBreakdown = computed(
  () => personalizedRecommendations.value?.subjectBreakdown ?? [],
);
const snapshotSyncStatus = ref<Status>("idle");
const snapshotSyncError = ref("");
const comparisonStatus = ref<Status>("idle");
const comparisonError = ref("");
const progressSummaryStatus = ref<Status>("idle");
const progressSummaryError = ref("");
const activeSnapshotCreatedAt = ref("");
const activeSnapshotComparison =
  ref<RecommendationSnapshotComparisonResponse | null>(null);
const recommendationProgressSummary =
  ref<RecommendationProgressSummaryResponse | null>(null);
const selectedTopicImprovementId = ref<string | null>(null);
const talkToDataQuestion = ref("");
const talkToDataAnswer = ref("");
const talkToDataError = ref("");
const talkToDataGeneratedAt = ref("");
const talkToDataStatus = ref<Status>("idle");
const text = computed(() => ({
  title: isSw.value ? "Takwimu za Ujifunzaji" : "Learning Statistics",
  competencesOpened: isSw.value ? "Umahiri Uliotembelea" : "Competences Opened",
  competencesHelper: isSw.value ? "Mada ambazo mwanafunzi amefungua." : "Topics the learner has opened.",
  subjectsOpened: isSw.value ? "Masomo Yaliyofunguliwa" : "Subjects Opened",
  subjectsHelper: isSw.value ? "Masomo yaliyofikiwa angalau mara moja." : "Subjects reached at least once.",
  timeSpent: isSw.value ? "Muda Uliotumika" : "Time Spent",
  timeSpentHelper: isSw.value ? "Jumla ya muda wa kujifunza uliofuatiliwa." : "Total tracked study time.",
  quizAttempts: isSw.value ? "Majaribio ya Quiz" : "Quiz Attempts",
  quizAttemptsHelper: isSw.value ? "Majaribio yaliyorekodiwa ya quiz za sura na video." : "Recorded chapter and video quiz tries.",
  averageQuizScore: isSw.value ? "Wastani wa Alama za Quiz" : "Average Quiz Score",
  averageQuizScoreHelper: isSw.value ? "Wastani wa alama kutoka quiz zilizofuatiliwa." : "Average score from tracked quizzes.",
  recommendationUnavailable: isSw.value ? "Mapendekezo binafsi hayapatikani kwa sasa." : "Personalized recommendations are temporarily unavailable.",
  profileDataStillAvailable: isSw.value ? "Taarifa zako za wasifu bado zinapatikana. Jaribu kufungua ukurasa upya baada ya muda mfupi." : "Your profile data is still available. Try refreshing the page in a moment.",
  doingWellSummary: isSw.value ? "Unaendelea vizuri kwenye mada zako za hivi karibuni." : "You are keeping up well with your recent topics.",
  keepReviewing: isSw.value ? "Endelea kupitia masomo ya hivi karibuni na songa mbele kwenye mada inayofuata." : "Keep reviewing your latest lessons and continue with the next topic in your current subject.",
  progressSinceSnapshot: isSw.value ? "Maendeleo Tangu Mapendekezo ya Mwisho" : "Progress Since Recommendation Snapshot",
  progressSinceSnapshotHelper: isSw.value ? "Fuatilia kilichobadilika baada ya mapendekezo yako ya mwisho kutolewa." : "Track what changed after your latest recommendation set was generated.",
  talkToData: isSw.value ? "Zungumza na Taarifa Zako" : "Talk To Your Data",
  talkToDataHelper: isSw.value ? "Uliza kuhusu rekodi yako ya ujifunzaji: mada ulizokamilisha, maeneo yenye udhaifu, quiz ulizoshindwa, kazi ambazo hazijakamilika, na cha kurejea baadaye." : "Ask questions about your own learning record: covered topics, weak areas, failed quizzes, unfinished work, and what to revise next.",
  askAboutData: isSw.value ? "Uliza kuhusu taarifa zako za ujifunzaji" : "Ask about your learning data",
  askPlaceholder: isSw.value ? "Mfano: Ni mada zipi sijazimaliza, na ninafeli wapi?" : "Example: Which topics have I not covered yet, and where am I failing?",
  groundedAnswer: isSw.value ? "Jibu linatokana na maendeleo ya wasifu wako, ufunikaji wa mada, na taarifa za tathmini." : "The answer is grounded in your profile progress, topic coverage, and assessment data.",
  analyzing: isSw.value ? "Inachambua..." : "Analyzing...",
  askYourData: isSw.value ? "Uliza Taarifa Zako" : "Ask Your Data",
  answerFromData: isSw.value ? "Jibu Kutoka Kwenye Taarifa Zako za Ujifunzaji" : "Answer From Your Learning Data",
  noUrgentRevision: isSw.value ? "Hakuna mada ya haraka ya kurejea kwa sasa." : "No urgent revision topics were found right now.",
  noUrgentRevisionHelper: isSw.value ? "Tumia mgawanyo hapo juu kuendelea kupitia mada ambazo hazijaguswa au hazijakamilika kabla mwalimu hajaangalia maendeleo yako." : "Use the breakdown above to keep reviewing untouched or partially completed topics before the teacher checks your progress.",
  revisitCompetence: isSw.value ? "Rudia Umahiri" : "Revisit Compitence",
  focusWhenRevisiting: isSw.value ? "Lenga unapopitia tena" : "Focus when revisiting",
  progress: isSw.value ? "Maendeleo" : "Progress",
  quiz: "Quiz",
}));

const talkToDataPrompts = computed(() => [
  isSw.value ? "Ni mada zipi bado sijazifunika?" : "Which topics have I not covered yet?",
  isSw.value ? "Ni somo gani ni dhaifu kwangu sasa?" : "Which subject is my weakest right now?",
  isSw.value ? "Nionyeshe mada ninazofeli." : "Show me the topics where I am failing.",
  isSw.value ? "Nirejee nini kabla mwalimu hajanipitia?" : "What should I revise before the teacher reviews me?",
]);
const talkToDataMarkdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

const actionLabels = computed<Record<RecommendationAction, string>>(() => ({
  start_topic: isSw.value ? "Anza mada" : "Start topic",
  rewatch_video: isSw.value ? "Tazama video tena" : "Rewatch video",
  review_notes: isSw.value ? "Pitia maelezo" : "Review notes",
  practice_quiz: isSw.value ? "Fanya quiz" : "Practice quiz",
}));

const actionHelperLabels = computed<Record<RecommendationAction, string>>(() => ({
  start_topic: isSw.value ? "Anza mada" : "Start topic",
  rewatch_video: isSw.value ? "Rudia somo" : "Revisit lesson",
  review_notes: isSw.value ? "Fungua maelezo ya mada" : "Open topic notes",
  practice_quiz: isSw.value ? "Pitia kisha fanya quiz" : "Review then practice",
}));

const reasonLabels = computed<Record<string, string>>(() => ({
  not_started: isSw.value ? "Haijaanza" : "Not started",
  low_progress: isSw.value ? "Maendeleo madogo" : "Low progress",
  low_assessment: isSw.value ? "Tathmini ndogo" : "Low assessment",
  started_not_finished: isSw.value ? "Imeanza, haijakamilika" : "Started, not finished",
  needs_practice: isSw.value ? "Inahitaji mazoezi" : "Needs practice",
}));

const recommendationOutcomeLabels = computed(() => ({
  not_started: isSw.value ? "Haijaanza" : "Not started",
  in_progress: isSw.value ? "Inaendelea" : "In progress",
  improved: isSw.value ? "Imeboreshwa" : "Improved",
  resolved: isSw.value ? "Imetatuliwa" : "Resolved",
  regressed: isSw.value ? "Imerudi nyuma" : "Regressed",
}) as const);

const formatRecommendationAction = (action: RecommendationAction) =>
  actionLabels.value[action] ?? action.replaceAll("_", " ");

const formatRecommendationActionHelper = (action: RecommendationAction) =>
  actionHelperLabels.value[action] ?? (isSw.value ? "Fungua mada" : "Open topic");

const formatReasonCode = (reasonCode: string) =>
  reasonLabels.value[reasonCode] ?? reasonCode.replaceAll("_", " ");

const getRecommendationOutcomeLabel = (status: string) =>
  recommendationOutcomeLabels.value[
    status as keyof typeof recommendationOutcomeLabels.value
  ] ?? status.replaceAll("_", " ");

const getRecommendationOutcomeClass = (status: string) => {
  if (status === "resolved") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "improved") {
    return "bg-sky-100 text-sky-800";
  }
  if (status === "in_progress") {
    return "bg-amber-100 text-amber-800";
  }
  if (status === "regressed") {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-slate-100 text-slate-700";
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

const comparisonTopics = computed(
  () => activeSnapshotComparison.value?.topics ?? [],
);
const comparisonTopicById = computed(() => {
  return new Map(
    comparisonTopics.value.map((topic) => [topic.topicId, topic]),
  );
});

const formatMetricValue = (
  value: number | null | undefined,
  suffix = "",
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${value}${suffix}`;
};

const formatMetricDelta = (
  value: number | null | undefined,
  suffix = "",
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
};

const getDeltaClass = (
  value: number | null | undefined,
  direction: "higher_is_better" | "lower_is_better" = "higher_is_better",
) => {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) {
    return "text-slate-500";
  }

  const isImprovement =
    direction === "higher_is_better" ? value > 0 : value < 0;

  return isImprovement ? "text-emerald-700" : "text-rose-700";
};

const getTopicComparison = (topicId: string) =>
  comparisonTopicById.value.get(topicId) ?? null;
const getTopicComparisonMetric = (
  topicId: string,
  phase: "before" | "after" | "delta",
  metric: "progressPercent" | "assessmentScore" | "assessmentAttempts",
) => {
  const topic = getTopicComparison(topicId);
  if (!topic) return null;

  return topic[phase][metric];
};
const selectedTopicImprovement = computed(() => {
  if (!selectedTopicImprovementId.value) return null;
  return getTopicComparison(selectedTopicImprovementId.value);
});
const openTopicImprovement = (topicId: string) => {
  if (!getTopicComparison(topicId)) return;
  selectedTopicImprovementId.value = topicId;
};
const closeTopicImprovement = () => {
  selectedTopicImprovementId.value = null;
};
const hasSnapshotAnalytics = computed(() => {
  return (
    snapshotSyncStatus.value !== "idle" ||
    comparisonStatus.value !== "idle" ||
    progressSummaryStatus.value !== "idle" ||
    Boolean(recommendationProgressSummary.value) ||
    Boolean(activeSnapshotComparison.value) ||
    Boolean(snapshotSyncError.value) ||
    Boolean(comparisonError.value) ||
    Boolean(progressSummaryError.value)
  );
});
const loadRecommendationProgressSummary = async () => {
  progressSummaryStatus.value = "loading";
  progressSummaryError.value = "";

  try {
    recommendationProgressSummary.value =
      await $fetch<RecommendationProgressSummaryResponse>(
        "/api/recommendations/progress-summary",
        {
          timeout: 12000,
        },
      );
    progressSummaryStatus.value = "success";
  } catch (error: any) {
    progressSummaryStatus.value = "error";
    progressSummaryError.value =
      error?.data?.message ||
      error?.message ||
      "Failed to load recommendation progress summary.";
  }
};

const loadSnapshotComparison = async (snapshotId: string) => {
  comparisonStatus.value = "loading";
  comparisonError.value = "";

  try {
    activeSnapshotComparison.value =
      await $fetch<RecommendationSnapshotComparisonResponse>(
        `/api/recommendations/snapshots/${snapshotId}/comparison`,
        {
          timeout: 12000,
        },
      );
    comparisonStatus.value = "success";
  } catch (error: any) {
    comparisonStatus.value = "error";
    comparisonError.value =
      error?.data?.message ||
      error?.message ||
      "Failed to load progress since the latest recommendation snapshot.";
  }
};

const syncActiveRecommendationSnapshot = async () => {
  const payload = personalizedRecommendations.value;

  if (!payload) return;

  snapshotSyncStatus.value = "loading";
  snapshotSyncError.value = "";

  try {
    let resolvedSnapshotId =
      activeRecommendationSnapshotGeneratedAt.value === payload.generatedAt
        ? activeRecommendationSnapshotId.value
        : null;

    if (!resolvedSnapshotId) {
      const created =
        await $fetch<RecommendationSnapshotCreateResponse>(
          "/api/recommendations/snapshots",
          {
            method: "POST",
            timeout: 12000,
            body: {
              generatedAt: payload.generatedAt,
              summary: payload.summary,
              overview: payload.overview,
              subjectBreakdown: payload.subjectBreakdown,
              topicBreakdown: payload.topicBreakdown,
              recommendations: payload.recommendations,
            },
          },
        );

      resolvedSnapshotId = created.snapshotId;
      activeSnapshotCreatedAt.value = created.generatedAt;
      setActiveSnapshot(created.snapshotId, payload.generatedAt);
    } else {
      activeSnapshotCreatedAt.value = payload.generatedAt;
    }

    snapshotSyncStatus.value = "success";

    void loadSnapshotComparison(resolvedSnapshotId);
    void loadRecommendationProgressSummary();
  } catch (error: any) {
    clearActiveSnapshot();
    activeSnapshotComparison.value = null;
    recommendationProgressSummary.value = null;
    comparisonStatus.value = "error";
    progressSummaryStatus.value = "error";
    snapshotSyncStatus.value = "error";
    snapshotSyncError.value =
      error?.data?.message ||
      error?.message ||
      "Failed to save the latest recommendation snapshot.";
  }
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

onMounted(() => {
  watch(
    () => personalizedRecommendations.value?.generatedAt,
    async (generatedAt) => {
      if (!generatedAt) return;
      await syncActiveRecommendationSnapshot();
    },
    {
      immediate: true,
    },
  );
});
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
      <div class="px-5 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue sm:px-6">
        <h3 class="text-lg font-semibold text-white">{{ text.title }}</h3>
      </div>
      <div
        class="grid w-full grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        <LearningMetricCard
          :label="text.competencesOpened"
          :value="profileData?.totalTopicsOpened ?? 0"
          :helper="text.competencesHelper"
          icon="fa6-solid:book-open-reader"
          icon-wrapper-class="bg-blue-100 text-deepBlue"
        />
        <LearningMetricCard
          :label="text.subjectsOpened"
          :value="profileData?.openedSubjects ?? 0"
          :helper="text.subjectsHelper"
          icon="heroicons:folder-open-20-solid"
          icon-wrapper-class="bg-green-100 text-emerald-700"
        />
        <LearningMetricCard
          :label="text.timeSpent"
          :value="profileData?.timeSpentFormatted ?? '0h 0m'"
          :helper="text.timeSpentHelper"
          icon="stash:clock-solid"
          icon-wrapper-class="bg-red-100 text-red-600"
        />
        <LearningMetricCard
          :label="text.quizAttempts"
          :value="displayQuizAttempts"
          :helper="text.quizAttemptsHelper"
          icon="solar:notebook-bold"
          icon-wrapper-class="bg-purple-100 text-purple-600"
        />
        <LearningMetricCard
          :label="text.averageQuizScore"
          :value="
            displayAverageQuizScore === '—'
              ? displayAverageQuizScore
              : `${displayAverageQuizScore}%`
          "
          :helper="text.averageQuizScoreHelper"
          icon="heroicons:chart-bar-16-solid"
          icon-wrapper-class="bg-indigo-100 text-indigo-600"
        />
      </div>

      <div
        v-if="recommendationStatus === 'pending'"
        class="space-y-4 bg-[#f8fbfd] p-4 sm:p-5 lg:p-6"
      >
        <div class="w-2/3 h-4 rounded bg-slate-200 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
      </div>

      <div
        v-else-if="recommendationError"
        class="bg-[#f8fbfd] p-4 sm:p-5 lg:p-6"
      >
        <div
          class="p-4 border border-amber-200 rounded-2xl bg-amber-50 text-amber-900"
        >
          <p class="font-medium">
            {{ text.recommendationUnavailable }}
          </p>
          <p class="mt-1 text-sm">
            {{ text.profileDataStillAvailable }}
          </p>
        </div>
      </div>

      <div
        v-else-if="!recommendationOverview && recommendationCards.length === 0"
        class="bg-[#f8fbfd] p-4 sm:p-5 lg:p-6"
      >
        <div class="p-5 border border-emerald-100 rounded-3xl bg-emerald-50/80">
          <p class="font-medium text-emerald-900">
            {{
              personalizedRecommendations?.summary ||
              text.doingWellSummary
            }}
          </p>
          <p class="mt-2 text-sm text-emerald-800">
            {{ text.keepReviewing }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="space-y-5 bg-[#f8fbfd] p-4 sm:p-5 lg:p-6"
      >
        <div class="border border-sky-100 rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <p class="text-sm leading-6 text-slate-700">
            {{ personalizedRecommendations?.summary }}
          </p>
        </div>

        <LearningOverviewHero
          v-if="recommendationOverview"
          :overview="recommendationOverview"
          :topic-count="topicBreakdown.length"
          :language="pageLanguage"
        />

        <section
          v-if="hasSnapshotAnalytics"
          class="border rounded-3xl border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div
            class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
          >
            <div>
              <h4 class="text-lg font-semibold text-slate-900">
                {{ text.progressSinceSnapshot }}
              </h4>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                {{ text.progressSinceSnapshotHelper }}
              </p>
            </div>

            <!-- <div class="grid gap-2 text-sm text-slate-600">
              <p v-if="activeSnapshotCreatedAt">
                Snapshot:
                <span class="font-medium text-slate-900">{{
                  formatGeneratedAt(activeSnapshotCreatedAt)
                }}</span>
              </p>
              <p v-if="activeSnapshotComparison?.comparedAt">
                Compared:
                <span class="font-medium text-slate-900">{{
                  formatGeneratedAt(activeSnapshotComparison.comparedAt)
                }}</span>
              </p>
            </div> -->
          </div>

          <div
            v-if="
              snapshotSyncStatus === 'loading' ||
              comparisonStatus === 'loading' ||
              progressSummaryStatus === 'loading'
            "
            class="grid gap-3 mt-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
          >
            <div
              v-for="index in 5"
              :key="index"
              class="h-24 rounded-3xl bg-slate-100 animate-pulse"
            ></div>
          </div>

          <div
            v-else-if="
              snapshotSyncError || comparisonError || progressSummaryError
            "
            class="p-4 mt-5 border rounded-2xl border-amber-200 bg-amber-50 text-amber-900"
          >
            <p class="font-medium">
              Snapshot analytics are temporarily unavailable.
            </p>
            <p class="mt-1 text-sm">
              {{
                snapshotSyncError ||
                comparisonError ||
                progressSummaryError
              }}
            </p>
          </div>

          <div
            v-else
            class="mt-5 space-y-5"
          >
            <div
              v-if="recommendationProgressSummary"
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
            >
              <div class="p-4 rounded-3xl bg-slate-50">
                <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Total Recommendations
                </p>
                <p class="mt-2 text-2xl font-semibold text-slate-900">
                  {{ recommendationProgressSummary.totalRecommendations }}
                </p>
              </div>
              <div class="p-4 rounded-3xl bg-emerald-50">
                <p class="text-xs font-semibold tracking-wide uppercase text-emerald-700">
                  Resolved
                </p>
                <p class="mt-2 text-2xl font-semibold text-emerald-900">
                  {{ recommendationProgressSummary.resolved }}
                </p>
              </div>
              <div class="p-4 rounded-3xl bg-sky-50">
                <p class="text-xs font-semibold tracking-wide uppercase text-sky-700">
                  Improving
                </p>
                <p class="mt-2 text-2xl font-semibold text-sky-900">
                  {{ recommendationProgressSummary.improving }}
                </p>
              </div>
              <div class="p-4 rounded-3xl bg-amber-50">
                <p class="text-xs font-semibold tracking-wide uppercase text-amber-700">
                  Not Started
                </p>
                <p class="mt-2 text-2xl font-semibold text-amber-900">
                  {{ recommendationProgressSummary.notStarted }}
                </p>
              </div>
              <div class="p-4 rounded-3xl bg-rose-50">
                <p class="text-xs font-semibold tracking-wide uppercase text-rose-700">
                  Regressed
                </p>
                <p class="mt-2 text-2xl font-semibold text-rose-900">
                  {{ recommendationProgressSummary.regressed }}
                </p>
              </div>
            </div>

            <div
              v-if="activeSnapshotComparison?.overview"
              class="grid gap-3 lg:grid-cols-2"
            >
              <div class="p-4 border rounded-3xl border-slate-200 bg-slate-50/70">
                <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Average Progress
                </p>
                <div class="grid gap-2 mt-3 text-sm sm:grid-cols-3">
                  <div>
                    <p class="text-slate-500">Before</p>
                    <p class="font-semibold text-slate-900">
                      {{
                        formatMetricValue(
                          activeSnapshotComparison.overview.before
                            .averageProgress,
                          "%",
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">After</p>
                    <p class="font-semibold text-slate-900">
                      {{
                        formatMetricValue(
                          activeSnapshotComparison.overview.after
                            .averageProgress,
                          "%",
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">Delta</p>
                    <p
                      class="font-semibold"
                      :class="
                        getDeltaClass(
                          activeSnapshotComparison.overview.delta
                            .averageProgress,
                        )
                      "
                    >
                      {{
                        formatMetricDelta(
                          activeSnapshotComparison.overview.delta
                            .averageProgress,
                          "%",
                        )
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="p-4 border rounded-3xl border-slate-200 bg-slate-50/70">
                <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Assessment Average
                </p>
                <div class="grid gap-2 mt-3 text-sm sm:grid-cols-3">
                  <div>
                    <p class="text-slate-500">Before</p>
                    <p class="font-semibold text-slate-900">
                      {{
                        formatMetricValue(
                          activeSnapshotComparison.overview.before
                            .averageAssessmentScore,
                          "%",
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">After</p>
                    <p class="font-semibold text-slate-900">
                      {{
                        formatMetricValue(
                          activeSnapshotComparison.overview.after
                            .averageAssessmentScore,
                          "%",
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">Delta</p>
                    <p
                      class="font-semibold"
                      :class="
                        getDeltaClass(
                          activeSnapshotComparison.overview.delta
                            .averageAssessmentScore,
                        )
                      "
                    >
                      {{
                        formatMetricDelta(
                          activeSnapshotComparison.overview.delta
                            .averageAssessmentScore,
                          "%",
                        )
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="p-4 border rounded-3xl border-slate-200 bg-slate-50/70">
                <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Quiz Attempts
                </p>
                <div class="grid gap-2 mt-3 text-sm sm:grid-cols-3">
                  <div>
                    <p class="text-slate-500">Before</p>
                    <p class="font-semibold text-slate-900">
                      {{
                        formatMetricValue(
                          activeSnapshotComparison.overview.before
                            .totalAssessmentAttempts,
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">After</p>
                    <p class="font-semibold text-slate-900">
                      {{
                        formatMetricValue(
                          activeSnapshotComparison.overview.after
                            .totalAssessmentAttempts,
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">Delta</p>
                    <p
                      class="font-semibold"
                      :class="
                        getDeltaClass(
                          activeSnapshotComparison.overview.delta
                            .totalAssessmentAttempts,
                        )
                      "
                    >
                      {{
                        formatMetricDelta(
                          activeSnapshotComparison.overview.delta
                            .totalAssessmentAttempts,
                        )
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="p-4 border rounded-3xl border-slate-200 bg-slate-50/70">
                <p class="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Covered / Failed Topics
                </p>
                <div class="grid gap-3 mt-3 text-sm sm:grid-cols-2">
                  <div>
                    <p class="text-slate-500">Covered delta</p>
                    <p
                      class="font-semibold"
                      :class="
                        getDeltaClass(
                          activeSnapshotComparison.overview.delta.coveredTopics,
                        )
                      "
                    >
                      {{
                        formatMetricDelta(
                          activeSnapshotComparison.overview.delta.coveredTopics,
                        )
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">Failed delta</p>
                    <p
                      class="font-semibold"
                      :class="
                        getDeltaClass(
                          activeSnapshotComparison.overview.delta.failedTopics,
                          'lower_is_better',
                        )
                      "
                    >
                      {{
                        formatMetricDelta(
                          activeSnapshotComparison.overview.delta.failedTopics,
                        )
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section
          class="border rounded-3xl border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div
            class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h4 class="text-lg font-semibold text-slate-900">
                {{ text.talkToData }}
              </h4>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                {{ text.talkToDataHelper }}
              </p>
            </div>

            <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
              <button
                v-for="prompt in talkToDataPrompts"
                :key="prompt"
                type="button"
                class="shrink-0 rounded-full border border-oceanBlue/15 bg-oceanBlue/5 px-3 py-2 text-xs font-medium text-oceanBlue transition-colors hover:bg-oceanBlue/10"
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
              {{ text.askAboutData }}
            </label>
            <textarea
              id="talk-to-data-input"
              v-model="talkToDataQuestion"
              rows="4"
              class="w-full px-4 py-3 text-sm transition-colors border rounded-2xl resize-y border-slate-200 bg-slate-50 focus:border-oceanBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/20"
              :placeholder="text.askPlaceholder"
            ></textarea>

            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-xs text-slate-500">
                {{ text.groundedAnswer }}
              </p>

              <button
                type="button"
                class="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl sm:w-auto bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                      ? text.analyzing
                      : text.askYourData
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
                  {{ text.answerFromData }}
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

        <LearningSubjectBreakdown
          :subjects="subjectBreakdown"
          :comparison-topics="comparisonTopics"
          @open-improvement="openTopicImprovement"
          @open-ai="openAiTeacherWithPrompt"
        />

        <div
          v-if="recommendationCards.length === 0"
          class="p-5 border border-emerald-100 rounded-3xl bg-emerald-50/80"
        >
          <p class="font-medium text-emerald-900">
            {{ text.noUrgentRevision }}
          </p>
          <p class="mt-2 text-sm text-emerald-800">
            {{ text.noUrgentRevisionHelper }}
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
                    {{ text.revisitCompetence }}
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
                    {{ text.focusWhenRevisiting }}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-slate-700">
                    {{ recommendation.attainmentFocus }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2 mt-4">
                  <span
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                  >
                    {{ text.progress }} {{ recommendation.progressPercent }}%
                  </span>
                  <span
                    v-if="recommendation.assessmentScore !== null"
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                  >
                    {{ text.quiz }} {{ recommendation.assessmentScore }}%
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
                class="inline-flex items-center justify-center w-full gap-2 px-4 py-3 font-semibold transition-colors border rounded-xl sm:w-auto border-oceanBlue/20 text-oceanBlue hover:bg-oceanBlue/5"
              >
                <Icon
                  name="heroicons:play-circle"
                  class="w-5 h-5"
                />
                <span>Open Compitence</span>
              </NuxtLink>

              <button
                type="button"
                class="inline-flex items-center justify-center w-full gap-2 px-4 py-3 font-semibold text-white transition-colors rounded-xl sm:w-auto bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
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
      <div class="px-5 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue sm:px-6">
        <h3 class="text-lg font-semibold text-white">
          Learning Topics Statistics
        </h3>
      </div>
      <div
        class="grid w-full grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
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

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedTopicImprovement"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 py-6"
          @click.self="closeTopicImprovement()"
        >
          <div
            class="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[90vh]"
          >
            <div
              class="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200"
            >
              <div>
                <p class="text-xs font-semibold tracking-wide uppercase text-oceanBlue">
                  Topic Improvement
                </p>
                <h4 class="mt-2 text-xl font-semibold text-slate-900">
                  {{ selectedTopicImprovement.topicName }}
                </h4>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                @click="closeTopicImprovement()"
              >
                <Icon
                  name="heroicons:x-mark-20-solid"
                  class="w-5 h-5"
                />
              </button>
            </div>

            <div class="space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="px-2.5 py-1 text-xs font-medium rounded-full"
                  :class="getRecommendationOutcomeClass(selectedTopicImprovement.status)"
                >
                  {{ getRecommendationOutcomeLabel(selectedTopicImprovement.status) }}
                </span>
                <span class="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                  {{ formatRecommendationAction(selectedTopicImprovement.recommendedAction) }}
                </span>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="p-4 rounded-2xl bg-slate-50">
                  <p class="text-xs uppercase text-slate-500">Progress</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ selectedTopicImprovement.before.progressPercent }}% →
                    {{ selectedTopicImprovement.after.progressPercent }}%
                  </p>
                  <p
                    class="mt-1 text-xs font-medium"
                    :class="getDeltaClass(selectedTopicImprovement.delta.progressPercent)"
                  >
                    {{ formatMetricDelta(selectedTopicImprovement.delta.progressPercent, "%") }}
                  </p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-50">
                  <p class="text-xs uppercase text-slate-500">Quiz score</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ formatMetricValue(selectedTopicImprovement.before.assessmentScore, "%") }} →
                    {{ formatMetricValue(selectedTopicImprovement.after.assessmentScore, "%") }}
                  </p>
                  <p
                    class="mt-1 text-xs font-medium"
                    :class="getDeltaClass(selectedTopicImprovement.delta.assessmentScore)"
                  >
                    {{ formatMetricDelta(selectedTopicImprovement.delta.assessmentScore, "%") }}
                  </p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-50">
                  <p class="text-xs uppercase text-slate-500">Attempts</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ selectedTopicImprovement.before.assessmentAttempts }} →
                    {{ selectedTopicImprovement.after.assessmentAttempts }}
                  </p>
                  <p
                    class="mt-1 text-xs font-medium"
                    :class="getDeltaClass(selectedTopicImprovement.delta.assessmentAttempts)"
                  >
                    {{ formatMetricDelta(selectedTopicImprovement.delta.assessmentAttempts) }}
                  </p>
                </div>
              </div>

              <div
                v-if="selectedTopicImprovement.quizSummarySinceSnapshot"
                class="p-4 rounded-2xl bg-sky-50 border border-sky-100"
              >
                <p class="text-xs font-semibold tracking-wide uppercase text-oceanBlue">
                  Quiz Activity Since Snapshot
                </p>
                <div class="grid gap-3 mt-3 sm:grid-cols-3 text-sm">
                  <p class="text-slate-700">
                    Attempts
                    <span class="font-semibold text-slate-900">{{
                      selectedTopicImprovement.quizSummarySinceSnapshot.attemptCount
                    }}</span>
                  </p>
                  <p class="text-slate-700">
                    Correct
                    <span class="font-semibold text-slate-900">{{
                      selectedTopicImprovement.quizSummarySinceSnapshot.correctCount
                    }}</span>
                  </p>
                  <p class="text-slate-700">
                    Incorrect
                    <span class="font-semibold text-slate-900">{{
                      selectedTopicImprovement.quizSummarySinceSnapshot.incorrectCount
                    }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
