<script setup lang="ts">
// @ts-nocheck
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { cn, shuffle } from "~/utilities/utils";
import Input from "~/components/ui/inputs/input";
import { Button } from "~/components/ui/button";
import ActivityTitle from "~/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import type { FeedbackType } from "~/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type CountingObjectsActivityProps = {
  feedback: FeedbackType;
  questions: {
    title: string;
    questions: {
      id: number;
      number: number;
    }[];
  };
};

const props = defineProps<CountingObjectsActivityProps>();
const ui = useActivityUiText();

// Colors for different place values (3D cube colors)
const PLACE_VALUE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#f97316",
];

const PLACE_VALUE_LABELS = [
  "Ones",
  "Tens",
  "Hundreds",
  "Thousands",
  "Ten Thousands",
  "Hundred Thousands",
  "Millions",
  "Ten Millions",
];

const PLACE_VALUE_SIZES = [20, 30, 45, 70, 60, 55, 50, 65];

const shuffledQuestions = ref([...props.questions.questions]);
const currentQuestionIndex = ref(0);
const score = ref(0);
const allAnswered = ref(false);
const userAnswer = ref("");
const answers = ref<Record<number, string>>({});
const feedbacks = ref<Record<number, boolean>>({});
const showResults = ref(false);
const isAnswerChecked = ref(false);
const activityInstructionsId = "numbers-counting-objects-instructions";

const { playSound } = useSoundEffects();

let advanceTimer: number | null = null;
onBeforeUnmount(() => {
  if (advanceTimer) window.clearTimeout(advanceTimer);
});

const shuffleQuestions = () => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
};

onMounted(() => {
  shuffleQuestions();
});

watch(
  () => props.questions.questions,
  () => {
    shuffleQuestions();
    currentQuestionIndex.value = 0;
    score.value = 0;
    allAnswered.value = false;
    userAnswer.value = "";
    answers.value = {};
    feedbacks.value = {};
    showResults.value = false;
    isAnswerChecked.value = false;
  },
);

watch(
  [currentQuestionIndex, answers],
  () => {
    userAnswer.value = answers.value[currentQuestionIndex.value] || "";
    isAnswerChecked.value = false;
  },
  { deep: true },
);

const currentQuestion = computed(() => shuffledQuestions.value[currentQuestionIndex.value]);
const placeValueBreakdown = computed(() => {
  const digits = (currentQuestion.value?.number ?? 0).toString().split("").reverse();
  return digits
    .map((digit, index) => ({
      digit: Number.parseInt(digit, 10),
      placeValue: Math.pow(10, index),
      label: PLACE_VALUE_LABELS[index] ?? `10^${index}`,
      color: PLACE_VALUE_COLORS[index % PLACE_VALUE_COLORS.length] ?? "#3b82f6",
      size: PLACE_VALUE_SIZES[index % PLACE_VALUE_SIZES.length] ?? 20,
      position: index,
    }))
    .reverse();
});

const isCurrentAnswerCorrect = computed(
  () => feedbacks.value[currentQuestionIndex.value],
);

const total = computed(() => shuffledQuestions.value.length);

const normalizeNumberString = (value: string) => value.replace(/[,\s]/g, "");
const isCorrectAnswer = (value: string, expected: number) => {
  const normalized = normalizeNumberString(value);
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed === expected;
};

const renderSimpleCubeStyle = (size: number, color: string) => ({
  width: `${size}px`,
  height: `${size}px`,
  margin: "2px",
  display: "inline-block",
  position: "relative",
  transformStyle: "preserve-3d",
  transform: "rotateX(-10deg) rotateY(-10deg)",
  flexShrink: 0,
} as const);

const faceStyle = (size: number, color: string, transform: string, filter?: string) =>
  ({
    position: "absolute",
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    border: "1px solid rgba(0,0,0,0.2)",
    transform,
    ...(filter ? { filter } : {}),
  }) as const;

const placeGridClass = (size: number) => {
  if (size <= 25) return "grid-cols-1 gap-2";
  if (size <= 40) return "grid-cols-2 gap-3";
  if (size <= 60) return "grid-cols-3 gap-4";
  return "grid-cols-3 gap-10";
};

const checkCurrentAnswer = () => {
  const q = currentQuestion.value;
  if (!q) return;

  const ok = isCorrectAnswer(userAnswer.value, q.number);

  feedbacks.value = { ...feedbacks.value, [currentQuestionIndex.value]: ok };
  answers.value = { ...answers.value, [currentQuestionIndex.value]: userAnswer.value };
  isAnswerChecked.value = true;

  if (ok) {
    score.value += 1;
    playSound("correct");
  } else {
    playSound("failure");
  }

  if (advanceTimer) window.clearTimeout(advanceTimer);
  advanceTimer = window.setTimeout(() => {
    if (currentQuestionIndex.value < shuffledQuestions.value.length - 1) {
      currentQuestionIndex.value += 1;
      isAnswerChecked.value = false;
      userAnswer.value = "";
    } else {
      allAnswered.value = true;
    }
  }, 1500);
};

const handleResetWithShuffle = () => {
  shuffleQuestions();
  currentQuestionIndex.value = 0;
  score.value = 0;
  allAnswered.value = false;
  userAnswer.value = "";
  answers.value = {};
  feedbacks.value = {};
  showResults.value = false;
  isAnswerChecked.value = false;
};
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="numbers-counting-objects-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="numbers-counting-objects-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye maonyesho ya thamani za nafasi, sehemu ya kuandika jibu, na kitufe cha kukagua."
          : "Use Tab to move through the place value displays, the answer field, and the check answer button."
      }}
    </p>

    <div v-if="!showResults" class="flex flex-col h-full bg-picton-blue-100">
      <div class="flex-1 overflow-y-auto py-2">
        <div :key="currentQuestionIndex" class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex gap-6 mb-8 justify-between">
            <div
              v-for="(place, idx) in placeValueBreakdown"
              :key="`${currentQuestionIndex}-${idx}`"
              class="bg-gray-50 rounded-lg p-4 border text-center grow"
            >
              <h4 class="font-medium text-neutral-700 text-2xl mb-3">
                {{ place.label }}
              </h4>
              <div class="min-h-[480px] flex items-center justify-center">
                <div v-if="place.digit === 0" class="text-gray-400 italic">
                  No {{ place.label.toLowerCase() }}
                </div>
                <div v-else :class="cn('grid justify-items-center', placeGridClass(place.size))">
                  <div v-for="i in place.digit" :key="i">
                    <div :style="renderSimpleCubeStyle(place.size, place.color)">
                      <div
                        :style="faceStyle(place.size, place.color, `translateZ(${place.size / 2}px)`)"
                      />
                      <div
                        :style="
                          faceStyle(
                            place.size,
                            place.color,
                            `translateZ(-${place.size / 2}px) rotateY(180deg)`,
                          )
                        "
                      />
                      <div
                        :style="
                          faceStyle(
                            place.size,
                            place.color,
                            `rotateY(90deg) translateZ(${place.size / 2}px)`,
                            'brightness(0.7)',
                          )
                        "
                      />
                      <div
                        :style="
                          faceStyle(
                            place.size,
                            place.color,
                            `rotateY(-90deg) translateZ(${place.size / 2}px)`,
                            'brightness(0.7)',
                          )
                        "
                      />
                      <div
                        :style="
                          faceStyle(
                            place.size,
                            place.color,
                            `rotateX(90deg) translateZ(${place.size / 2}px)`,
                            'brightness(1.2)',
                          )
                        "
                      />
                      <div
                        :style="
                          faceStyle(
                            place.size,
                            place.color,
                            `rotateX(-90deg) translateZ(${place.size / 2}px)`,
                            'brightness(0.5)',
                          )
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col md:flex-row md:justify-end items-center gap-4">
            <div>
              <div class="flex items-center gap-4">
                <Input
                  type="text"
                  :model-value="userAnswer"
                  :disabled="isAnswerChecked"
                  class="max-w-xs !text-2xl text-center"
                  placeholder="Enter the number"
                  :aria-label="ui.isSwahili ? `Jibu la swali la ${currentQuestionIndex + 1}` : `Answer for question ${currentQuestionIndex + 1}`"
                  @update:modelValue="(v: string) => (userAnswer = v)"
                />
                <div
                  v-if="isAnswerChecked"
                  :class="
                    cn(
                      'flex items-center justify-center rounded-full p-2',
                      isCurrentAnswerCorrect
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600',
                    )
                  "
                >
                  <span class="text-lg leading-none">
                    {{ isCurrentAnswerCorrect ? "✓" : "✕" }}
                  </span>
                </div>
              </div>

              <div
                v-if="
                  isAnswerChecked &&
                  !isCurrentAnswerCorrect &&
                  props.feedback === 'wrong-correct-answers'
                "
                class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p class="text-red-700 text-sm">
                  {{ ui.correctAnswer }}
                  <strong>{{ currentQuestion?.number?.toLocaleString?.() }}</strong>
                </p>
              </div>
            </div>

            <div class="flex gap-3">
              <Button
                v-if="!isAnswerChecked"
                variant="brand-lemon"
                :disabled="!userAnswer.trim()"
                :onClick="checkCurrentAnswer"
              >
                {{
                  currentQuestionIndex < total - 1 ? ui.nextQuestion : ui.checkAnswer
                }}
              </Button>
              <Button
                v-else
                variant="brand-lemon"
                :disabled="true"
                class="flex items-center gap-2"
              >
                {{
                  currentQuestionIndex < total - 1
                    ? "Moving to Next..."
                    : "Finishing Activity..."
                }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-2 p-4 bg-white">
        <div
          v-for="(_, idx) in shuffledQuestions"
          :key="idx"
          :class="
            cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative',
              {
                'bg-picton-blue-200': answers[idx] === undefined && idx !== currentQuestionIndex,
                'bg-lemon-200': answers[idx] !== undefined,
                'border-2 border-picton-blue-500':
                  idx === currentQuestionIndex && answers[idx] === undefined,
                'border-2 border-lemon-500':
                  idx === currentQuestionIndex && answers[idx] !== undefined,
              },
            )
          "
        >
          <span v-if="answers[idx] !== undefined" class="absolute text-sm">
            {{ feedbacks[idx] ? "✓" : "✕" }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col h-full bg-picton-blue-100 text-lg p-6 overflow-y-auto"
    >
      <div class="bg-picton-blue-50 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div
            v-for="(question, idx) in shuffledQuestions"
            :key="idx"
            :class="
              cn(
                'p-4 rounded-lg border',
                feedbacks[idx] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200',
              )
            "
          >
            <div class="flex justify-between items-center mb-2">
              <div>
                <p class="font-medium">{{ ui.formatQuestion(idx + 1) }}</p>
                <p class="text-sm text-gray-600">
                  Number: {{ question.number.toLocaleString() }}
                </p>
              </div>
              <div
                :class="
                  cn(
                    'flex items-center justify-center rounded-full p-1',
                    feedbacks[idx] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
                  )
                "
              >
                <span class="text-base leading-none">{{ feedbacks[idx] ? "✓" : "✕" }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p class="text-sm text-gray-500">{{ ui.yourAnswer }}</p>
                <p
                  :class="
                    cn('font-medium', feedbacks[idx] ? 'text-green-600' : 'text-red-600')
                  "
                >
                  {{ answers[idx] || "(no answer)" }}
                </p>
              </div>
              <div
                v-if="props.feedback === 'wrong-correct-answers' && !feedbacks[idx]"
              >
                <p class="text-sm text-gray-500">{{ ui.correctAnswer }}</p>
                <p class="text-green-600 font-medium">
                  {{ question.number.toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults :score="score" :total="total" :onRestart="handleResetWithShuffle" />
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="total"
      :open="allAnswered && !showResults"
      :onOpenChange="(open: boolean) => { if (!open) showResults = true }"
    />
  </section>
</template>
