<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/inputs/input.vue";
import { cn, shuffle, getImageUrl } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { ActivityType, type FeedbackType } from "@/lib/types/activity-types";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper.vue";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { Icon } from "@iconify/vue";

type TItemsLabellingProps = {
  questions: {
    title: string;
    notes: string;
    algorithm: ActivityType;
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    questions: {
      image: string;
      answer: string;
      id?: number;
    }[];
  };
  feedback: FeedbackType;
};

type AnswerOption = {
  id: string;
  value: string;
};

const props = defineProps<TItemsLabellingProps>();
const ui = useActivityUiText();

const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const completedObjectIds = ref<number[]>([]);
const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit: 9,
  autoFetch: !!props.questions.isGameMode,
});

const currentQuestions = ref<{ image: string; answer: string; id?: number }[]>([]);
const feedbacks = ref<Record<number, boolean>>({});
const textAnswers = ref<string[]>([]);
const placedAnswers = ref<Record<number, AnswerOption>>({});
const shuffledOptions = ref<AnswerOption[]>([]);
const selectedOptionId = ref<string | null>(null);
const showSubmitButton = ref(false);
const isComplete = ref(false);
const showResults = ref(false);
const timeUp = ref(false);
const isResetting = ref(false);
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());
const activityInstructionsId = "items-labelling-instructions";
const activityStatusId = "items-labelling-status";
const keyboardStatusMessage = ref("");

const isGameMode = computed(() => !!props.questions.isGameMode);
const isDragMode = computed(
  () => !isGameMode.value && props.questions.algorithm === ActivityType.ItemsLabelingWithClues,
);
const gameQuestions = computed(() =>
  isGameMode.value
    ? objects.value.map((obj) => ({
        image: obj.imagePath ? getImageUrl(obj.imagePath, true) : "",
        answer: obj.name.toLowerCase(),
        id: obj.id,
      }))
    : props.questions.questions,
);
const score = computed(() => Object.values(feedbacks.value).filter(Boolean).length);

const initializeActivity = () => {
  currentQuestions.value = shuffle([...gameQuestions.value]);
  feedbacks.value = {};
  textAnswers.value = Array.from({ length: currentQuestions.value.length }, () => "");
  placedAnswers.value = {};
  shuffledOptions.value = shuffle(
    currentQuestions.value.map((question, index) => ({
      id: `option-${index}`,
      value: question.answer,
    })),
  );
  selectedOptionId.value = null;
  showSubmitButton.value = false;
  isComplete.value = false;
  showResults.value = false;
  timeUp.value = false;
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
};

watch([gameQuestions, loading], ([questions, isLoading]) => {
  if (isLoading || !questions.length) return;
  initializeActivity();
}, { immediate: true });

watch(textAnswers, (value) => {
  if (isDragMode.value || isComplete.value) return;
  showSubmitButton.value = value.every((answer) => answer.trim() !== "");
}, { deep: true });

watch(placedAnswers, (value) => {
  if (!isDragMode.value || isComplete.value) return;
  if (Object.keys(value).length === currentQuestions.value.length) {
    handleSubmit();
  }
}, { deep: true });

const selectedOption = computed(
  () => shuffledOptions.value.find((option) => option.id === selectedOptionId.value) || null,
);

const optionLabel = (option?: AnswerOption | null) => option?.value || "";

const imageSlotLabel = (questionIndex: number) =>
  ui.isSwahili.value
    ? `Picha ya ${questionIndex + 1}`
    : `Image ${questionIndex + 1}`;

const getAvailableOptions = () => {
  const usedOptionIds = Object.values(placedAnswers.value).map((answer) => answer.id);
  return shuffledOptions.value.filter((option) => !usedOptionIds.includes(option.id));
};

const setTextAnswer = (index: number, value: string | number) => {
  if (isComplete.value || timeUp.value) return;
  textAnswers.value = textAnswers.value.map((answer, answerIndex) =>
    answerIndex === index ? String(value ?? "") : answer,
  );
};

const placeSelectedOption = (questionIndex: number) => {
  if (isComplete.value || timeUp.value) return;

  if (!selectedOption.value) {
    keyboardStatusMessage.value = ui.isSwahili.value
      ? "Chagua lebo kwanza kabla ya kuiweka."
      : "Select a label first before placing it.";
    return;
  }

  const nextAnswers = { ...placedAnswers.value };

  Object.entries(nextAnswers).forEach(([index, answer]) => {
    if (answer.id === selectedOption.value?.id) {
      delete nextAnswers[Number(index)];
    }
  });

  nextAnswers[questionIndex] = selectedOption.value;
  placedAnswers.value = nextAnswers;
  keyboardStatusMessage.value = ui.formatActivityPlaced(
    imageSlotLabel(questionIndex),
    optionLabel(selectedOption.value),
  );
  selectedOptionId.value = null;
  playSound("click");
};

const clearPlacedOption = (questionIndex: number) => {
  if (isComplete.value || timeUp.value) return;
  const nextAnswers = { ...placedAnswers.value };
  const removedAnswer = nextAnswers[questionIndex];
  delete nextAnswers[questionIndex];
  placedAnswers.value = nextAnswers;
  keyboardStatusMessage.value = ui.formatActivityRemoved(
    imageSlotLabel(questionIndex),
    optionLabel(removedAnswer),
  );
  playSound("click");
};

const handleSubmit = () => {
  if (isComplete.value) return;

  const nextFeedbacks: Record<number, boolean> = {};
  const nextCompletedQuestions = new Set<number>();
  const nextIncorrectQuestions = new Set<number>();

  currentQuestions.value.forEach((question, index) => {
    const userAnswer = isDragMode.value
      ? placedAnswers.value[index]?.value || ""
      : textAnswers.value[index] || "";

    const isCorrect = answerChecker.checkAnswer(userAnswer, {
      strictMode: true,
      acceptedAnswers: [question.answer],
    }).isCorrect;

    nextFeedbacks[index] = isCorrect;
    nextCompletedQuestions.add(index);
    if (!isCorrect) {
      nextIncorrectQuestions.add(index);
    }
  });

  const nextScore = Object.values(nextFeedbacks).filter(Boolean).length;
  feedbacks.value = nextFeedbacks;
  completedQuestions.value = nextCompletedQuestions;
  incorrectQuestions.value = nextIncorrectQuestions;
  isComplete.value = true;
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${nextScore} / ${currentQuestions.value.length}.`;
  playSound("success");
};

const handleRestart = async () => {
  isResetting.value = true;

  if (isGameMode.value) {
    const updatedIds = [...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)])];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
  } else {
    initializeActivity();
  }

  setTimeout(() => {
    isResetting.value = false;
  }, 100);

  keyboardStatusMessage.value = "";
};

const handleGameTimeUp = () => {
  if (isComplete.value || timeUp.value) return;
  timeUp.value = true;
  handleSubmit();
  playSound("failure");
};

const handleGameComplete = () => {
  if (!isComplete.value && !timeUp.value) {
    handleSubmit();
  }
};
</script>

<template>
  <div v-if="isGameMode && loading" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">Loading objects...</h1>
  </div>

  <div v-else-if="isGameMode && error" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold text-red-700">Error loading objects: {{ error }}</h1>
  </div>

  <div v-else-if="isGameMode && !gameQuestions.length" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">No objects found for the specified criteria</h1>
  </div>

  <GameModeWrapper
    v-else
    class="h-full"
    :is-game-mode="isGameMode"
    :total-questions="currentQuestions.length"
    :completed-questions="completedQuestions"
    :incorrect-questions="incorrectQuestions"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleGameTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <section
      class="flex h-full flex-col"
      aria-labelledby="items-labelling-title"
      :aria-describedby="activityInstructionsId"
    >
      <h2 id="items-labelling-title" class="sr-only">
        {{ props.questions.title }}
      </h2>
      <ActivityTitle :title="props.questions.title" />
      <p :id="activityInstructionsId" class="sr-only">
        {{
          ui.isSwahili
            ? "Tumia tab kusogea kwenye picha, sehemu za majibu, na chaguo za lebo. Chagua lebo kwa enter au space kisha chagua mahali pa kuiweka."
            : "Use Tab to move through the images, answer areas, and available labels. Select a label with Enter or Space, then choose where to place it."
        }}
      </p>
      <p :id="activityStatusId" aria-live="polite" class="sr-only">
        {{ keyboardStatusMessage }}
      </p>

      <div class="flex flex-1 flex-col gap-4">
        <div class="rounded-2xl bg-picton-blue-50 p-4">
          <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div
              v-for="(question, index) in currentQuestions"
              :key="`${question.answer}-${index}`"
              :class="
                cn(
                  'relative flex flex-col items-center gap-4 rounded-xl p-4',
                  isComplete && feedbacks[index]
                    ? 'border-2 border-green-200 bg-green-50'
                    : isComplete
                      ? 'border-2 border-red-200 bg-red-50'
                      : 'bg-white',
                )
              "
            >
              <img :src="question.image" :alt="question.answer" class="h-40 min-w-40 object-contain">

              <div v-if="isDragMode" class="w-full">
                <button
                  type="button"
                  :aria-label="placedAnswers[index] ? `${ui.yourAnswer}: ${placedAnswers[index]?.value}` : (ui.isSwahili ? `Weka lebo kwa picha ya ${question.answer}` : `Place a label for image ${question.answer}`)"
                  :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                  :class="
                    cn(
                      'flex min-h-[44px] w-full items-center justify-center rounded-lg border border-dashed px-3 py-2 text-center text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
                      placedAnswers[index]
                        ? isComplete && feedbacks[index]
                          ? 'border-green-300 bg-green-100 text-green-700'
                          : isComplete
                            ? 'border-red-300 bg-red-100 text-red-700'
                            : 'border-lemon-300 bg-lemon-100 text-lemon-800'
                        : 'border-picton-blue-200 bg-picton-blue-100 text-picton-blue-700',
                    )
                  "
                  @click="placedAnswers[index] ? clearPlacedOption(index) : placeSelectedOption(index)"
                >
                  {{ placedAnswers[index]?.value || "Choose label" }}
                </button>
              </div>

              <div v-else class="w-full">
                <Input
                  :model-value="textAnswers[index]"
                  :disabled="isComplete || timeUp"
                  :aria-label="ui.isSwahili ? `Jibu la picha ${index + 1}` : `Answer for image ${index + 1}`"
                  :class="
                    cn(
                      'rounded-none border-x-0 border-t-0 border-b-2 border-dashed bg-transparent text-center text-lg',
                      isComplete && feedbacks[index] && 'border-green-600 text-green-600',
                      isComplete && !feedbacks[index] && 'border-red-600 text-red-600',
                      !isComplete && 'border-picton-blue-600 text-picton-blue-600',
                    )
                  "
                  @update:model-value="(value) => setTextAnswer(index, String(value ?? ''))"
                />
              </div>

              <div
                v-if="isComplete && props.feedback === 'wrong-correct-answers' && !feedbacks[index]"
                class="text-sm text-green-600"
              >
                {{ ui.formatCorrect(question.answer) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="isDragMode && !isComplete" class="rounded-2xl bg-white p-4 shadow-sm">
          <div class="mb-3 text-sm font-medium text-oceanBlue">Available labels</div>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-3" role="group" :aria-label="ui.isSwahili ? 'Lebo zinazopatikana' : 'Available labels'">
            <button
              v-for="option in getAvailableOptions()"
              :key="option.id"
              type="button"
              :aria-pressed="selectedOptionId === option.id"
              :aria-label="ui.isSwahili ? `Chagua lebo ${option.value}` : `Choose label ${option.value}`"
              :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
              :class="
                cn(
                  'rounded-lg px-3 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
                  selectedOptionId === option.id
                    ? 'bg-picton-blue-500 text-white'
                    : 'bg-picton-blue-100 text-picton-blue-700 hover:bg-picton-blue-200',
                )
              "
              @click="
                () => {
                  const isSelected = selectedOptionId === option.id;
                  selectedOptionId = isSelected ? null : option.id;
                  keyboardStatusMessage = isSelected
                    ? ui.formatActivityRemoved(ui.availableAnswerChoices.value, option.value)
                    : ui.formatActivitySelected(ui.availableAnswerChoices.value, option.value);
                }
              "
            >
              {{ option.value }}
            </button>
          </div>
        </div>

        <div v-if="showSubmitButton && !isComplete && !isDragMode" class="flex justify-end">
          <Button
            @click="handleSubmit"
            class="group gap-2 px-6 py-2"
          >
            <Icon
              icon="heroicons:sparkles"
              width="18"
              height="18"
              class="text-lemon-600 transition-transform duration-200 group-hover:scale-110 animate-pulse"
            />
            {{ ui.checkAnswers }}
          </Button>
        </div>

        <ActivityResults
          v-if="showResults"
          :score="timeUp ? 0 : score"
          :total="currentQuestions.length"
          :on-restart="handleRestart"
        />
      </div>

      <ActivityResultsAlertDialog
        :score="timeUp ? 0 : score"
        :total="currentQuestions.length"
        :open="isComplete && !isResetting && !showResults"
        :on-open-change="
          (open) => {
            if (open) {
              return;
            }
            if (props.feedback === 'none') {
              handleRestart();
            } else {
              showResults = true;
            }
          }
        "
      />
    </section>
  </GameModeWrapper>
</template>
