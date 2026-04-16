<script setup lang="ts">
// @ts-nocheck
import type { AsyncDataRequestStatus } from '#app';
import { nextTick } from "vue";
import type { ServerQuestionType } from '~/types/activity-props';
import { type Activity } from '~/types/activity-types';
import { enhancedActivityComponents } from '~/utilities/activityMapper/enhanced-mapper';
import activityPropsTranspiler from '~~/shared/transpilerMapper';
import type { ActivityType } from "~/types/activity-types";
import apiDocs from "~/utilities/apiDocs";
import {
  getApiContentLanguage,
  resolveEducationLevelFromRoute,
  resolveRouteLanguage,
} from "~/utilities/educationRoute";
import {
  activityAuthHeaders,
  extractActivityFromPayload,
  normalizeActivity,
} from "~/utilities/activitiesApi";
import { Icon } from "@iconify/vue";

type ActivityCompletionPayload = {
  activityId: string;
  score: number;
  totalQuestions: number;
  userAnswers: unknown[];
  savedAnswers: unknown[];
};

// prpops
const props = withDefaults(defineProps<{
  activityId: string;
  onActivityInteracted?: (activityId: string) => void;
  onActivityCompleted?: (payload: ActivityCompletionPayload) => void;
}>(), {});
// states variable
const status = ref<AsyncDataRequestStatus>('idle');
const activity = ref<Activity>();
const error = ref<Error>();
const wrongQuestionsFormat = ref<boolean>(false);
const isMobile = useIsMobile()
const route = useRoute();
const primaryContentLanguage = usePrimaryContentLanguage();
const ui = useActivityUiText();
const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const contentLanguage = computed(() =>
  resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
);
const apiLanguage = computed(() =>
  getApiContentLanguage(educationLevel.value, contentLanguage.value),
);
const activityRoot = ref<HTMLElement | null>(null);
const hasReportedInteraction = ref(false);
const hasReportedCompletion = ref(false);
let removeInteractionListeners: (() => void) | null = null;
let completionObserver: MutationObserver | null = null;

const setWrongQuestionsFormat = (state:boolean)=>wrongQuestionsFormat.value = state; 

// load activity data
const fetchData = async () => {
    status.value = 'pending'
    error.value = undefined;
    try {
        const response = await $fetch(
          apiDocs.activities.getActivityId.replace("{id}", props.activityId),
          {
            headers: activityAuthHeaders(),
            query: apiLanguage.value
              ? { language: apiLanguage.value }
              : undefined,
          }
        );

        const normalizedActivity = normalizeActivity(
          extractActivityFromPayload(response)
        );

        if (!normalizedActivity) {
          throw new Error("Activity payload is invalid.");
        }

        activity.value = normalizedActivity as Activity;
        status.value = 'success';
    } catch (e) {
        error.value = e as any;
        activity.value = undefined;
        status.value = 'error';
        console.error(`[error while fetching activity info]:${error}`);
    }
}


// computed component to map
watch(
    () => [props.activityId, apiLanguage.value],
    async ([value]) => {
        if (!value) {
            activity.value = undefined;
            status.value = 'idle';
            return;
        }

        await fetchData();
    },
    { immediate: true }
)

// preparing component
const activityComponent = computed(() => activity.value && enhancedActivityComponents[activity.value?.description])

// transplier
const transpiler = computed(() => activity.value && activityPropsTranspiler[activity.value.description])
const transpiledQuestions = ref<Record<string, unknown> | null>(null);

watchEffect(() => {
    if (!activity.value || !transpiler.value) {
        wrongQuestionsFormat.value = false;
        transpiledQuestions.value = null;
        return;
    }

    wrongQuestionsFormat.value = false;
    transpiledQuestions.value =
      transpiler.value({
        setWrongQuestionsFormat,
        summary: (activity.value.summary as string),
        algorithm: (activity.value.description as ActivityType),
        summaryPath: (activity.value.summaryPath as string),
        serverQuestions: (activity.value.questions as ServerQuestionType[]),
        titleDescription: (activity.value.activityDescription as string),
        isMobile,
      }) ?? null;
})

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

const teardownActivityTracking = () => {
  removeInteractionListeners?.();
  removeInteractionListeners = null;
  completionObserver?.disconnect();
  completionObserver = null;
};

const emitActivityInteracted = () => {
  if (hasReportedInteraction.value) return;
  hasReportedInteraction.value = true;
  props.onActivityInteracted?.(props.activityId);
};

const emitActivityCompleted = (payload?: Partial<ActivityCompletionPayload>) => {
  emitActivityInteracted();

  if (hasReportedCompletion.value) return;

  hasReportedCompletion.value = true;
  props.onActivityCompleted?.({
    activityId: props.activityId,
    score: toNumber(payload?.score),
    totalQuestions: toNumber(payload?.totalQuestions),
    userAnswers: toArray(payload?.userAnswers),
    savedAnswers: toArray(payload?.savedAnswers),
  });
};

const handleActivityComplete = (
  score: number,
  totalQuestions: number,
  userAnswers: unknown[] = [],
  savedAnswers: unknown[] = [],
) => {
  emitActivityCompleted({
    score,
    totalQuestions,
    userAnswers,
    savedAnswers,
  });
};

const handleAnswerRecorded = () => {
  emitActivityInteracted();
};

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(
    target.closest(
      'button, input, textarea, select, [role="button"], [draggable="true"], [contenteditable="true"]',
    ),
  );

const detectResultsUi = () => {
  if (!activityRoot.value || hasReportedCompletion.value) return;
  if (activityRoot.value.querySelector("[data-activity-results]")) {
    emitActivityCompleted();
  }
};

const setupActivityTracking = async () => {
  teardownActivityTracking();

  if (status.value !== "success") return;

  await nextTick();

  const root = activityRoot.value;
  if (!root) return;

  const interactionHandler = (event: Event) => {
    if (!isInteractiveTarget(event.target)) return;
    emitActivityInteracted();
  };

  const keyboardHandler = (event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (!isInteractiveTarget(keyboardEvent.target)) return;

    if (
      [
        "Enter",
        " ",
        "Spacebar",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(keyboardEvent.key)
    ) {
      emitActivityInteracted();
    }
  };

  const listenerEntries: Array<[keyof HTMLElementEventMap, EventListener]> = [
    ["click", interactionHandler],
    ["input", interactionHandler],
    ["change", interactionHandler],
    ["drop", interactionHandler],
    ["dragend", interactionHandler],
    ["keydown", keyboardHandler],
  ];

  listenerEntries.forEach(([eventName, handler]) => {
    root.addEventListener(eventName, handler, true);
  });

  removeInteractionListeners = () => {
    listenerEntries.forEach(([eventName, handler]) => {
      root.removeEventListener(eventName, handler, true);
    });
  };

  completionObserver = new MutationObserver(() => {
    detectResultsUi();
  });

  completionObserver.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  detectResultsUi();
};

watch(
  () => [props.activityId, status.value],
  async ([, nextStatus]) => {
    teardownActivityTracking();
    hasReportedInteraction.value = false;
    hasReportedCompletion.value = false;

    if (nextStatus === "success") {
      await setupActivityTracking();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  teardownActivityTracking();
});
</script>
<template>
    <div ref="activityRoot">
        <div v-if="status === 'idle'">{{ ui.nothingToShow }}</div>
        <div
          v-else-if="status == 'pending'"
          class="flex min-h-[260px] flex-col items-center justify-center gap-4 px-4 text-center"
        >
          <div class="relative">
            <span
              class="absolute -inset-8 animate-ping rounded-full bg-oceanBlue opacity-70"
            />
            <span
              class="absolute -inset-6 rounded-full bg-sky-50 opacity-60 blur-sm"
            />
            <Icon
              icon="heroicons:sparkles"
              width="40"
              height="40"
              class="relative text-oceanBlue animate-bounce"
            />
          </div>

          <p class="text-lg font-semibold text-oceanBlue/90">{{ ui.loading }}</p>
        </div>
        <div v-else-if="status == 'success'" class="">
            <div v-if="!activity || !transpiler || !transpiledQuestions || wrongQuestionsFormat" class="">
                 {{ ui.activityUnavailable }}
            </div>
            <component
              v-else
              :is="activityComponent"
              :activity-id="props.activityId"
              feedback="wrong-correct"
              :questions="transpiledQuestions"
              :on-activity-complete="handleActivityComplete"
              :on-answer-recorded="handleAnswerRecorded"
            />
        </div>
        <div v-else-if="status == 'error'">{{ error }}</div>
        <div v-else>{{ ui.unknownIssue }}</div>
    </div>
</template>
