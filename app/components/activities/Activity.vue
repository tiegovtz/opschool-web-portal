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
  resolveEducationLevelFromRoute,
  resolveRouteLanguage,
} from "~/utilities/educationRoute";
import {
  activityAuthHeaders,
  extractActivityFromPayload,
  normalizeActivity,
} from "~/utilities/activitiesApi";
import { getActivityAriaLiveBehavior } from "~/utilities/activityAriaLiveBehaviors";
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
const { state: ariaLive, announce, clear } = useActivityAriaLive();
const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const contentLanguage = computed(() =>
  resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
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
    () => props.activityId,
    async (value) => {
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
const activityAriaBehavior = computed(() =>
  getActivityAriaLiveBehavior(activity.value?.description),
);
const lastSelectedAnnouncementValue = ref("");

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

const handleActivityComplete = async (
  score: number,
  totalQuestions: number,
  userAnswers: unknown[] = [],
  savedAnswers: unknown[] = [],
) => {
  await announce(
    ui.activityUpdates.value,
    `${ui.answersChecked.value}. ${score} / ${totalQuestions}`,
  );
  emitActivityCompleted({
    score,
    totalQuestions,
    userAnswers,
    savedAnswers,
  });
};

const handleAnswerRecorded = async (
  questionIndex?: number,
  answer?: unknown,
  isCorrect?: boolean,
) => {
  const label =
    typeof questionIndex === "number" && Number.isFinite(questionIndex)
      ? ui.formatQuestion(questionIndex + 1)
      : ui.activityUpdates.value;

  const normalizedAnswer =
    answer == null
      ? ""
      : typeof answer === "string"
        ? answer.trim()
        : String(answer).trim();

  const message =
    normalizedAnswer
      ? ui.formatActivityUpdated(label, normalizedAnswer)
      : typeof isCorrect === "boolean"
        ? ui.formatQuestionResult(
            typeof questionIndex === "number" ? questionIndex + 1 : 1,
            isCorrect,
          )
        : ui.formatActivityActivated(label);

  announce(label, message);
  if (normalizedAnswer) {
    lastSelectedAnnouncementValue.value = normalizedAnswer;
  }
  emitActivityInteracted();
};

const getElementLabel = (element: HTMLElement) => {
  const ariaLabel = element.getAttribute("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }

  if (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement) {
    const label =
      element.labels?.[0]?.textContent?.trim() ||
      element.placeholder?.trim() ||
      element.name?.trim();
    if (label) return label;
  }

  return element.getAttribute("title")?.trim() || element.textContent?.trim() || "";
};

const normalizeAnnouncementValue = (value?: string | null) =>
  (value || "")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/g, "")
    .trim();

const extractValueAfterPhrase = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeAnnouncementValue(match[1]);
    }
  }

  return "";
};

const getPressedState = (element: HTMLElement) =>
  element.getAttribute("aria-pressed") === "true" ||
  element.getAttribute("aria-selected") === "true" ||
  element.getAttribute("aria-checked") === "true";

const getInteractiveElementValue = (element: HTMLElement, fallbackLabel: string) => {
  if (element instanceof HTMLInputElement) {
    if (["checkbox", "radio"].includes(element.type)) {
      return normalizeAnnouncementValue(element.value) || fallbackLabel;
    }

    return normalizeAnnouncementValue(element.value);
  }

  if (element instanceof HTMLTextAreaElement) {
    return normalizeAnnouncementValue(element.value);
  }

  if (element instanceof HTMLSelectElement) {
    return normalizeAnnouncementValue(
      element.selectedOptions[0]?.textContent?.trim() || element.value,
    );
  }

  return normalizeAnnouncementValue(
    element.getAttribute("data-aria-live-message")?.trim() ||
      element.textContent?.trim() ||
      fallbackLabel,
  );
};

const createButtonAnnouncement = (
  element: HTMLElement,
  label: string,
  behavior: ReturnType<typeof getActivityAriaLiveBehavior>,
) => {
  const normalizedLabel = normalizeAnnouncementValue(label);
  const lowerLabel = normalizedLabel.toLowerCase();
  const value = getInteractiveElementValue(element, normalizedLabel);

  if (
    /(check answers|check answer|view results|play again|try again|next question|show blocks|show results|start|continue)/i
      .test(lowerLabel)
  ) {
    return {
      label: normalizedLabel || ui.activityUpdates.value,
      message: ui.formatActivityActivated(normalizedLabel || ui.activityUpdates.value),
    };
  }

  if (behavior === "abacus") {
    const addValue = extractValueAfterPhrase(normalizedLabel, [
      /add one bead to (.+?)(?:\.|$)/i,
      /ongeza shanga moja kwenye (.+?)(?:\.|$)/i,
    ]);
    if (addValue) {
      return {
        label: normalizedLabel,
        message: ui.formatActivityPlaced(normalizedLabel, addValue),
      };
    }

    const removeValue = extractValueAfterPhrase(normalizedLabel, [
      /remove one bead from (.+?)(?:\.|$)/i,
      /ondoa shanga moja kutoka (.+?)(?:\.|$)/i,
    ]);
    if (removeValue) {
      return {
        label: normalizedLabel,
        message: ui.formatActivityRemoved(normalizedLabel, removeValue),
      };
    }
  }

  if (behavior === "placement" || behavior === "matching") {
    const removeValue =
      extractValueAfterPhrase(normalizedLabel, [
        /remove (.+?)(?: from .+|\.|$)/i,
        /ondoa (.+?)(?: kutoka .+|\.|$)/i,
      ]) || value;

    if (/(remove|ondoa)/i.test(lowerLabel)) {
      return {
        label: normalizedLabel,
        message: ui.formatActivityRemoved(normalizedLabel, removeValue),
      };
    }

    const placeValue =
      extractValueAfterPhrase(normalizedLabel, [
        /place (.+?)(?: in .+| into .+| on .+|\.|$)/i,
        /weka (.+?)(?: kwenye .+| ndani ya .+|\.|$)/i,
        /match with (.+?)(?:\.|$)/i,
      ]) || lastSelectedAnnouncementValue.value || value;

    if (/(place|blank|slot|match|pair|connect|drop|weka|nafasi)/i.test(lowerLabel)) {
      return {
        label: normalizedLabel,
        message: ui.formatActivityPlaced(normalizedLabel, placeValue),
      };
    }

    if (/(choose|select|chagua)/i.test(lowerLabel) || getPressedState(element)) {
      const selectedValue =
        extractValueAfterPhrase(normalizedLabel, [
          /choose (.+?)(?:\.|$)/i,
          /select (.+?)(?:\.|$)/i,
          /chagua (.+?)(?:\.|$)/i,
        ]) || value;

      if (selectedValue) {
        lastSelectedAnnouncementValue.value = selectedValue;
      }

      return {
        label: normalizedLabel,
        message: ui.formatActivitySelected(normalizedLabel, selectedValue),
      };
    }
  }

  if (behavior === "selection" || behavior === "toggle-grid" || behavior === "hybrid") {
    const message = getPressedState(element)
      ? ui.formatActivitySelected(normalizedLabel, value)
      : ui.formatActivityActivated(normalizedLabel || value || ui.activityUpdates.value);

    if (value) {
      lastSelectedAnnouncementValue.value = value;
    }

    return {
      label: normalizedLabel || ui.activityUpdates.value,
      message,
    };
  }

  return {
    label: normalizedLabel || ui.activityUpdates.value,
    message: ui.formatActivityActivated(normalizedLabel || value || ui.activityUpdates.value),
  };
};

const createInteractionAnnouncement = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return null;

  const element = target.closest(
    "input, textarea, select, button, [role='button'], [contenteditable='true']",
  );

  if (!(element instanceof HTMLElement)) return null;

  if (
    event.type === "click" &&
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement)
  ) {
    return null;
  }

  const label = getElementLabel(element) || ui.activityUpdates.value;
  const behavior = activityAriaBehavior.value;

  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") {
      return {
        label,
        message: element.checked
          ? ui.formatActivitySelected(label, getInteractiveElementValue(element, label))
          : ui.formatActivityRemoved(label, getInteractiveElementValue(element, label)),
      };
    }

    if (element.type === "radio") {
      const value = getInteractiveElementValue(element, label) || label;
      lastSelectedAnnouncementValue.value = value;
      return {
        label,
        message: ui.formatActivitySelected(label, value),
      };
    }

    return {
      label,
      message: ui.formatActivityUpdated(label, element.value),
    };
  }

  if (element instanceof HTMLTextAreaElement) {
    return {
      label,
      message: ui.formatActivityUpdated(label, element.value),
    };
  }

  if (element instanceof HTMLSelectElement) {
    const selectedOption = element.selectedOptions[0]?.textContent?.trim() || element.value;
    lastSelectedAnnouncementValue.value = normalizeAnnouncementValue(selectedOption);
    return {
      label,
      message: ui.formatActivitySelected(label, selectedOption),
    };
  }

  return createButtonAnnouncement(element, label, behavior);
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
    announce(ui.activityUpdates.value, ui.resultsReady.value);
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

  const announcementHandler = (event: Event) => {
    const announcement = createInteractionAnnouncement(event);
    if (!announcement) return;
    announce(announcement.label, announcement.message);
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
    ["change", announcementHandler],
    ["click", announcementHandler],
    ["drop", announcementHandler],
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
    clear();

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
        <div
          :key="ariaLive.sequence"
          class="sr-only"
          :aria-label="ariaLive.label || ui.activityUpdates"
          aria-live="assertive"
          aria-atomic="true"
        >
          {{ ariaLive.message }}
        </div>
    </div>
</template>
