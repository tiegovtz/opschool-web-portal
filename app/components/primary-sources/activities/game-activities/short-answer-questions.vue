<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useDebounceFn } from "@vueuse/core";
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/inputs/input.vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper.vue";
import type { GameStats } from "@/components/ui/game-mode";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useObjects, type GameObject } from "~/composables/useObjects";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Question = {
  id: number;
  question: string;
  answer: string;
  image?: string | null;
};

type Props = {
  questions: {
    title: string;
    type?: string;
    fontSize?: number;
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
};

const props = defineProps<Props>();
const ui = useActivityUiText();

const { objects, loading, error, refetch } = useObjects({
  type: props.questions.type || null,
  limit: 10,
  autoFetch: true,
});

const gameQuestions = ref<Question[]>([]);
const score = ref(0);
const allAnswered = ref(false);
const checkedItems = ref<number[]>([]);
const answers = ref<Record<number, string>>({});
const feedbacks = ref<Record<number, boolean>>({});
const showResults = ref(false);
const gameComplete = ref(false);
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());
const completedObjectIds = ref<number[]>([]);
const activityInstructionsId = "game-short-answer-instructions";

const { playSound } = useSoundEffects();

const buildQuestions = (sourceObjects: GameObject[]) => {
  const nextQuestions = sourceObjects
    .filter((item) => item.name?.trim())
    .map((item) => ({
      id: item.id,
      question: item.syllables?.trim() || item.name,
      answer: item.name,
      image: getImageUrl(item.imagePath, true),
    }));

  gameQuestions.value = shuffle(nextQuestions);
};

watch(
  objects,
  (value) => {
    if (value.length) {
      buildQuestions(value);
    }
  },
  { immediate: true },
);

const allQuestionsAnswered = computed(() =>
  gameQuestions.value.every((_, index) => (answers.value[index] || "").trim() !== ""),
);

const handleTimeUp = () => {
  if (!gameComplete.value) {
    handleCheckAllAnswers();
  }
};

const handleGameComplete = (_stats: GameStats) => {
  gameComplete.value = true;
};

const handleResetWithShuffle = async () => {
  score.value = 0;
  allAnswered.value = false;
  checkedItems.value = [];
  answers.value = {};
  feedbacks.value = {};
  showResults.value = false;
  gameComplete.value = false;
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();

  if (props.questions.isGameMode) {
    const currentObjectIds = objects.value.map((item) => item.id);
    const nextExcludedIds = [...completedObjectIds.value, ...currentObjectIds];
    completedObjectIds.value = nextExcludedIds;
    await refetch(nextExcludedIds);
    return;
  }

  buildQuestions(objects.value);
};

const checkAnswer = (userAnswer: string, correctAnswer: string) =>
  userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

const handleCheckAllAnswers = () => {
  let nextScore = 0;
  const nextFeedbacks: Record<number, boolean> = {};
  const nextCheckedItems: number[] = [];
  const nextCompletedQuestions = new Set<number>();
  const nextIncorrectQuestions = new Set<number>();

  gameQuestions.value.forEach((question, index) => {
    const userAnswer = answers.value[index] || "";
    const isCorrect = checkAnswer(userAnswer, question.answer);

    nextFeedbacks[index] = isCorrect;
    nextCheckedItems.push(index);
    nextCompletedQuestions.add(index);

    if (!isCorrect) {
      nextIncorrectQuestions.add(index);
    } else {
      nextScore += 1;
    }
  });

  score.value = nextScore;
  feedbacks.value = nextFeedbacks;
  checkedItems.value = nextCheckedItems;
  completedQuestions.value = nextCompletedQuestions;
  incorrectQuestions.value = nextIncorrectQuestions;
  allAnswered.value = true;
  gameComplete.value = true;

  playSound(nextScore === gameQuestions.value.length ? "success" : "failure");
};

const debouncedCheckAndSave = useDebounceFn(() => {}, 1000);

const handleInputChange = (index: number, value: string) => {
  answers.value = {
    ...answers.value,
    [index]: value,
  };

  debouncedCheckAndSave();
};

const handleInputUpdate = (index: number, value: string) => {
  handleInputChange(index, value);
};

const handleResultsDialogChange = (open: boolean) => {
  if (!open) {
    showResults.value = true;
  }
};
</script>

<template>
  <div
    v-if="loading"
    class="flex min-h-[400px] items-center justify-center"
  >
    <div class="text-lg">Loading questions...</div>
  </div>

  <div
    v-else-if="error"
    class="flex min-h-[400px] items-center justify-center"
  >
    <div class="text-lg text-red-500">Error loading questions: {{ error }}</div>
  </div>

  <div
    v-else-if="gameQuestions.length === 0"
    class="flex min-h-[400px] items-center justify-center"
  >
    <div class="text-lg">No questions available</div>
  </div>

  <GameModeWrapper
    v-else
    :is-game-mode="props.questions.isGameMode || false"
    :total-questions="gameQuestions.length"
    :completed-questions="completedQuestions"
    :incorrect-questions="incorrectQuestions"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleTimeUp"
    :on-game-complete="handleGameComplete"
    :show-timer="props.questions.isGameMode || false"
    :show-progress="props.questions.isGameMode || false"
  >
    <section
      class="flex h-full flex-col"
      aria-labelledby="game-short-answer-title"
      :aria-describedby="activityInstructionsId"
    >
      <h2 id="game-short-answer-title" class="sr-only">
        {{ props.questions.title }}
      </h2>
      <ActivityTitle :title="props.questions.title" />
      <p :id="activityInstructionsId" class="sr-only">
        {{
          ui.isSwahili
            ? "Tumia tab kusogea kwenye kila swali na sehemu ya jibu. Andika jibu lako, kisha tumia tab kufikia kitufe cha kukagua."
            : "Use Tab to move through each question and answer field. Type your answer, then use Tab to reach the check answers button."
        }}
      </p>

      <div class="flex h-full flex-col gap-2 bg-picton-blue-100">
        <div
          class="flex-1 space-y-4 overflow-y-auto py-4"
          :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
        >
          <div
            v-for="(question, index) in gameQuestions"
            :key="question.id"
            :class="
              cn('flex min-h-[80px] items-center rounded-lg', {
                'bg-picton-blue-50': !checkedItems.includes(index),
                'bg-green-100 text-green-700': feedbacks[index] === true,
                'bg-red-100 text-red-700': feedbacks[index] === false,
                'bg-lemon-50 text-lemon-700':
                  checkedItems.includes(index) && feedbacks[index] === undefined,
              })
            "
            :aria-labelledby="`game-short-answer-question-${question.id}`"
          >
            <div class="flex w-full items-center justify-between px-4 py-2">
              <div>
                <span class="mr-2 font-medium text-gray-600 md:mr-4">{{ index + 1 }}.</span>

                <div v-if="question.image" class="mr-4 h-28">
                  <img
                    :src="question.image"
                    :alt="question.question"
                    class="h-full w-full rounded-lg object-cover"
                  />
                </div>

                <div class="inline-flex flex-1 items-center gap-4">
                  <span :id="`game-short-answer-question-${question.id}`" class="font-medium">{{ question.question }}</span>

                  <span class="mx-1 inline-flex w-[150px] flex-col">
                    <Input
                      :model-value="answers[index] || ''"
                      type="text"
                      :disabled="checkedItems.includes(index)"
                      class="min-w-0 border-none bg-transparent px-2 text-center focus:outline-none"
                      :style="{ maxWidth: '320px' }"
                      :aria-label="ui.isSwahili ? `Jibu la swali ${index + 1}: ${question.question}` : `Answer for question ${index + 1}: ${question.question}`"
                      @update:model-value="handleInputUpdate(index, $event)"
                    />
                    <div
                      :class="
                        cn('border-b border-dashed border-picton-blue-700', {
                          'border-lemon-700': checkedItems.includes(index),
                        })
                      "
                    />
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <template v-if="checkedItems.includes(index)">
                  <div
                    :class="
                      cn(
                        'flex items-center justify-center rounded-full p-1',
                        feedbacks[index]
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600',
                      )
                    "
                  >
                    <Icon
                      :icon="feedbacks[index] ? 'mdi:check' : 'mdi:close'"
                      width="20"
                      height="20"
                    />
                  </div>

                  <div
                    v-if="props.feedback === 'wrong-correct-answers' && feedbacks[index] === false"
                    class="text-sm font-medium text-red-600"
                  >
                    Answer: {{ question.answer }}
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults
          v-if="showResults"
          :score="score"
          :total="gameQuestions.length"
          :on-restart="handleResetWithShuffle"
        />

        <div v-else class="relative flex justify-end">
          <Button
            variant="brand-lemon"
            size="lg"
            :disabled="!allQuestionsAnswered || allAnswered"
            @click="handleCheckAllAnswers"
            class="gap-2"
          >
            <Icon
              icon="heroicons:sparkles"
              width="18"
              height="18"
              class="text-lemon-700 animate-pulse"
            />
            {{
              allAnswered ? ui.answersChecked : ui.checkAnswers
            }}
          </Button>
        </div>
      </div>

      <ActivityResultsAlertDialog
        :score="score"
        :total="gameQuestions.length"
        :open="allAnswered && !showResults"
        :on-open-change="handleResultsDialogChange"
      />
    </section>
  </GameModeWrapper>
</template>
