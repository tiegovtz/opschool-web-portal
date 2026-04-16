<script setup lang="ts">
// @ts-nocheck
import { computed, nextTick, ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import  Input  from "@/components/ui/inputs/input.vue";
import ActivityTitle from "@/components/templates/activity-title";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { Button } from "@/components/ui/button";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { Icon } from "@iconify/vue";

type QuestionOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
  correct: boolean;
};

type MultipleChoiceQuestion = {
  question: string;
  image?: string;
  options: QuestionOption[];
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    notes: string;
    image?: string;
    questions: MultipleChoiceQuestion[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const activeQuestion = ref(0);
const currentAnswer = ref("");
const inputRef = ref<any>(null);
const attemptedQuestions = ref<Record<number, { answer: string; isCorrect: boolean; text: string }>>({});
const showResults = ref(false);
const shuffledQuestions = ref<MultipleChoiceQuestion[]>([]);
const allAnswers = ref<Record<number, string>>({});
const answersChecked = ref(false);
const isAdvancingQuestion = ref(false);
const activityInstructionsId = "multiple-choice-with-notes-instructions";
const activityStatusId = "multiple-choice-with-notes-status";

const hasNotes = computed(() => !!props.questions.notes?.trim());
const currentQuestionData = computed(
  () => shuffledQuestions.value[activeQuestion.value],
);

const getQuestionId = (index: number) => `multiple-choice-with-notes-question-${index}`;
const getOptionsId = (index: number) => `multiple-choice-with-notes-options-${index}`;
const getOptionId = (questionIndex: number, optionId: string) =>
  `multiple-choice-with-notes-option-${questionIndex}-${optionId.toLowerCase()}`;
const getInputId = (index: number) => `multiple-choice-with-notes-input-${index}`;
const getInputLabelId = (index: number) => `multiple-choice-with-notes-input-label-${index}`;
const getQuestionStatusId = (index: number) => `multiple-choice-with-notes-question-status-${index}`;
const getProgressLabel = (index: number) => {
  const attempt = attemptedQuestions.value[index];

  if (!attempt) {
    return ui.isSwahili
      ? `Swali la ${index + 1} bado halijajibiwa`
      : `Question ${index + 1} not answered yet`;
  }

  return attempt.isCorrect
    ? ui.isSwahili
      ? `Swali la ${index + 1} limejibiwa kwa usahihi`
      : `Question ${index + 1} answered correctly`
    : ui.isSwahili
      ? `Swali la ${index + 1} limejibiwa vibaya`
      : `Question ${index + 1} answered incorrectly`;
};

const getQuestionResultText = (index: number) =>
  attemptedQuestions.value[index]?.isCorrect
    ? ui.isSwahili
      ? "Jibu sahihi"
      : "Correct answer"
    : ui.isSwahili
      ? "Jibu si sahihi"
      : "Incorrect answer";

const getValidOptionIds = (question: MultipleChoiceQuestion | undefined) =>
  question?.options.map((option) => option.id.toUpperCase()) ?? [];

const normalizeAnswer = (value: string, question: MultipleChoiceQuestion | undefined) => {
  const upperValue = value.toUpperCase();

  if (upperValue === "") return "";
  return getValidOptionIds(question).includes(upperValue) ? upperValue : null;
};

const activityStatusMessage = computed(() => {
  if (showResults.value) {
    return ui.isSwahili
      ? `Matokeo yanaonyeshwa. Umepata ${score.value} kati ya ${shuffledQuestions.value.length}.`
      : `Results are shown. You scored ${score.value} out of ${shuffledQuestions.value.length}.`;
  }

  if (hasNotes.value) {
    return ui.isSwahili
      ? `Swali la ${activeQuestion.value + 1} kati ya ${shuffledQuestions.value.length}.`
      : `Question ${activeQuestion.value + 1} of ${shuffledQuestions.value.length}.`;
  }

  if (answersChecked.value) {
    return ui.isSwahili
      ? `Majibu yamekaguliwa. Umepata ${score.value} kati ya ${shuffledQuestions.value.length}.`
      : `Answers checked. You scored ${score.value} out of ${shuffledQuestions.value.length}.`;
  }

  const answeredCount = Object.values(allAnswers.value).filter((answer) => answer !== "").length;
  return ui.isSwahili
    ? `Umejaza majibu ${answeredCount} kati ya ${shuffledQuestions.value.length}.`
    : `You have entered answers for ${answeredCount} of ${shuffledQuestions.value.length} questions.`;
});

const initialize = () => {
  shuffledQuestions.value = shuffle(props.questions.questions);
  score.value = 0;
  allAnswered.value = false;
  activeQuestion.value = 0;
  currentAnswer.value = "";
  attemptedQuestions.value = {};
  showResults.value = false;
  allAnswers.value = {};
  answersChecked.value = false;
  isAdvancingQuestion.value = false;
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

watch(
  [activeQuestion, shuffledQuestions, showResults],
  async ([, , resultsVisible]) => {
    if (resultsVisible) return;
    await nextTick();
    inputRef.value?.focus?.();
  },
  { flush: "post" },
);

const allQuestionsAnswered = computed(
  () =>
    Object.keys(allAnswers.value).length === shuffledQuestions.value.length &&
    Object.values(allAnswers.value).every((answer) => answer !== ""),
);

const checkAnswer = (answer: string) => {
  if (isAdvancingQuestion.value || attemptedQuestions.value[activeQuestion.value]) {
    return;
  }

  isAdvancingQuestion.value = true;
  const question = shuffledQuestions.value[activeQuestion.value];
  const correctOption = question.options.find((option) => option.correct);
  const isCorrect = answer.toLowerCase() === correctOption?.id.toLowerCase();
  const nextAttempt = {
    answer,
    isCorrect,
    text: question.options.find((option) => option.id === answer.toUpperCase())?.text || "",
  };

  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [activeQuestion.value]: nextAttempt,
  };

  playSound(isCorrect ? "correct" : "failure");

  if (activeQuestion.value < shuffledQuestions.value.length - 1) {
    window.setTimeout(() => {
      activeQuestion.value += 1;
      currentAnswer.value = "";
      isAdvancingQuestion.value = false;
    }, 500);
    return;
  }

  const nextAttempts = {
    ...attemptedQuestions.value,
    [activeQuestion.value]: nextAttempt,
  };

  score.value = Object.values(nextAttempts).reduce(
    (total, item) => total + (item.isCorrect ? 1 : 0),
    0,
  );
  allAnswered.value = true;
  isAdvancingQuestion.value = false;
};

const handleInputChange = (value: string) => {
  const normalizedValue = normalizeAnswer(value, currentQuestionData.value);
  if (normalizedValue === null) {
    return;
  }

  currentAnswer.value = normalizedValue;
  if (normalizedValue !== "") {
    checkAnswer(normalizedValue);
  }
};

const handleAllAtOnceInputChange = (questionIndex: number, value: string) => {
  const normalizedValue = normalizeAnswer(value, shuffledQuestions.value[questionIndex]);
  if (normalizedValue === null) {
    return;
  }

  allAnswers.value = {
    ...allAnswers.value,
    [questionIndex]: normalizedValue,
  };
};

const checkAllAnswers = () => {
  const nextAttempts: Record<number, { answer: string; isCorrect: boolean; text: string }> = {};

  shuffledQuestions.value.forEach((question, index) => {
    const answer = allAnswers.value[index] || "";
    const correctOption = question.options.find((option) => option.correct);
    const isCorrect = answer.toLowerCase() === correctOption?.id.toLowerCase();

    nextAttempts[index] = {
      answer,
      isCorrect,
      text: question.options.find((option) => option.id === answer.toUpperCase())?.text || "",
    };
  });

  attemptedQuestions.value = nextAttempts;
  answersChecked.value = true;
  score.value = Object.values(nextAttempts).reduce(
    (total, item) => total + (item.isCorrect ? 1 : 0),
    0,
  );

  if (score.value >= shuffledQuestions.value.length / 2) {
    playSound("correct");
  } else {
    playSound("failure");
  }

  allAnswered.value = true;
};

const resetActivity = () => {
  initialize();
};

const resultRows = computed(() =>
  shuffledQuestions.value.map((question, index) => {
    const attempt = attemptedQuestions.value[index];
    const correctOption = question.options.find((option) => option.correct);
    return {
      question,
      attempt,
      correctOption,
      isCorrect: attempt?.isCorrect || false,
    };
  }),
);
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="multiple-choice-with-notes-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="multiple-choice-with-notes-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye swali, chaguo, na kisanduku cha jibu. Andika herufi ya jibu kwenye kisanduku."
          : "Use Tab to move through the question, answer choices, and answer field. Type the answer letter in the input."
      }}
    </p>
    <p :id="activityStatusId" aria-live="polite" class="sr-only">
      {{ activityStatusMessage }}
    </p>

    <div
      v-if="showResults"
      class="flex flex-1 flex-col items-center justify-between overflow-auto md:p-4"
    >
      <div class="w-full space-y-3" role="list" :aria-label="ui.isSwahili ? 'Muhtasari wa matokeo' : 'Results summary'">
        <div
          v-for="(row, index) in resultRows"
          :key="index"
          role="listitem"
          :aria-labelledby="`multiple-choice-with-notes-result-${index}`"
          :class="
            cn(
              'flex items-center gap-3 rounded-md border p-3',
              row.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50',
            )
          "
        >
          <div
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                row.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
              )
            "
            aria-hidden="true"
          >
            {{ row.isCorrect ? "✓" : "✕" }}
          </div>

          <div class="flex-1">
            <p :id="`multiple-choice-with-notes-result-${index}`" class="font-medium">
              {{ ui.formatQuestion(index + 1) }}
            </p>
            <div class="mt-1 flex flex-col gap-1 text-sm">
              <p>{{ row.question.question }}</p>
              <span v-if="props.feedback === 'wrong-correct-answers'">
                {{ ui.correctAnswer }}
                <strong>{{ row.correctOption?.id }}. {{ row.correctOption?.text }}</strong>
              </span>
              <span
                v-if="row.attempt"
                :class="row.isCorrect ? 'text-green-600' : 'text-red-600'"
              >
                {{ row.attempt.answer }}. {{ row.attempt.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 w-full">
        <ActivityResults
          :score="score"
          :total="shuffledQuestions.length"
          :onRestart="resetActivity"
        />
      </div>
    </div>

    <div v-else-if="hasNotes" class="flex min-h-0 flex-1 flex-col gap-4">
      <!--
        Mobile: full-length passage (no inner scroll) → questions → progress.
        lg+: passage LEFT (inner scroll if long) | questions RIGHT. Progress full width below.
      -->
      <div
        class="flex min-h-0 flex-1 flex-col gap-4 lg:min-h-[min(70vh,calc(100dvh-220px))] lg:flex-row lg:items-stretch lg:gap-6"
      >
        <!-- Passage / essay: left on lg; column max-height + inner scroll so long text does not stretch the page -->
        <div
          class="flex w-full min-w-0 flex-col lg:min-h-0 lg:flex-[1_1_50%] lg:max-h-[min(62vh,calc(100dvh-240px))] lg:overflow-hidden"
        >
          <div
            class="scrollbar-thin rounded-2xl border border-oceanBlue/15 bg-white p-4 shadow-sm sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
          >
            <LeftNotesWithImages
              :notes="props.questions.notes"
              :image="props.questions.image"
              class-name="w-full min-h-0 border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </div>

        <!-- Active question: below passage on mobile; right column on wide screens -->
        <div class="flex min-h-0 w-full min-w-0 flex-col lg:min-h-0 lg:flex-[1_1_50%] lg:self-stretch">
          <div
            class="flex min-h-0 flex-col rounded-xl border border-picton-blue-100 bg-white p-4 shadow-sm md:p-6 lg:h-full lg:min-h-0"
          >
            <div
              class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
              role="group"
              :aria-labelledby="getQuestionId(activeQuestion)"
              :aria-describedby="`${activityInstructionsId} ${getOptionsId(activeQuestion)} ${activityStatusId}`"
            >
              <h3 :id="getQuestionId(activeQuestion)" class="shrink-0 text-base text-picton-blue-700 sm:text-lg">
                {{ activeQuestion + 1 }}. {{ currentQuestionData?.question }}
              </h3>

              <div class="flex min-h-0 flex-1 flex-col gap-4">
                <div
                  class="flex min-h-0 flex-1 flex-col gap-2"
                  role="list"
                  :id="getOptionsId(activeQuestion)"
                  :aria-label="ui.isSwahili ? `Chaguo za swali la ${activeQuestion + 1}` : `Answer choices for question ${activeQuestion + 1}`"
                >
                  <div
                    v-for="(option, optionIndex) in currentQuestionData?.options || []"
                    :key="optionIndex"
                    role="listitem"
                    :id="getOptionId(activeQuestion, option.id)"
                    class="flex items-start gap-2 text-base font-thin text-picton-blue-700 sm:text-lg"
                    style="font-family: var(--font-shaky-hand-some-comic);"
                  >
                    <p class="shrink-0">{{ option.id }})</p>
                    <p class="min-w-0 flex-1 break-words">{{ option.text }}</p>
                  </div>
                </div>

                <div
                  class="mt-auto flex shrink-0 flex-col gap-3 border-t border-picton-blue-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <label :id="getInputLabelId(activeQuestion)" :for="getInputId(activeQuestion)" class="sr-only">
                    {{
                      ui.isSwahili
                        ? `Jibu la swali ${activeQuestion + 1}`
                        : `Answer for question ${activeQuestion + 1}`
                    }}
                  </label>
                  <div class="flex flex-wrap items-center gap-3">
                    <Input
                      :id="getInputId(activeQuestion)"
                      ref="inputRef"
                      :model-value="currentAnswer"
                      type="text"
                      maxlength="1"
                      inputmode="text"
                      autocapitalize="characters"
                      :aria-labelledby="getInputLabelId(activeQuestion)"
                      :aria-describedby="`${activityInstructionsId} ${getOptionsId(activeQuestion)} ${activityStatusId}`"
                      :class="
                        cn('h-12 w-12 shrink-0 rounded bg-picton-blue-200 text-center text-2xl', {
                          'bg-lemon-200 text-lemon-700': currentAnswer,
                        })
                      "
                      @update:model-value="(value) => handleInputChange(String(value ?? ''))"
                    />
                    <p
                      v-if="attemptedQuestions[activeQuestion]"
                      :id="getQuestionStatusId(activeQuestion)"
                      role="status"
                      class="text-sm font-medium"
                      :class="attemptedQuestions[activeQuestion].isCorrect ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ getQuestionResultText(activeQuestion) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Answer progress: detached from scroll areas, full width -->
      <div
        class="shrink-0 rounded-xl border border-picton-blue-200 bg-picton-blue-50/90 px-3 py-3 sm:px-4 sm:py-4"
      >
        <div
          class="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4"
          role="list"
          :aria-label="ui.isSwahili ? 'Maendeleo ya maswali' : 'Question progress'"
        >
          <div
            v-for="(_, index) in shuffledQuestions"
            :key="index"
            role="listitem"
            :aria-label="getProgressLabel(index)"
            :class="
              cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm sm:h-10 sm:w-10 sm:text-base',
                {
                  'bg-lemon-200': attemptedQuestions[index],
                  'bg-picton-blue-200': !attemptedQuestions[index],
                  'border-2 border-picton-blue-500': index === activeQuestion && !attemptedQuestions[index],
                },
              )
            "
          >
            <template v-if="attemptedQuestions[index]">
              <span aria-hidden="true">
                {{ attemptedQuestions[index].isCorrect ? "✓" : "✕" }}
              </span>
            </template>
            <span v-else class="sr-only">{{ getProgressLabel(index) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex h-full flex-col gap-4 overflow-auto">
      <div class="rounded-xl bg-white p-4 md:p-6">
        <div class="flex flex-col gap-4" role="list" :aria-label="ui.isSwahili ? 'Maswali ya kuchagua jibu' : 'Multiple choice questions'">
          <div
            v-for="(question, questionIndex) in shuffledQuestions"
            :key="questionIndex"
            role="listitem"
            :aria-labelledby="getQuestionId(questionIndex)"
            :aria-describedby="`${getOptionsId(questionIndex)} ${activityInstructionsId} ${activityStatusId}`"
            :class="
              cn('rounded-lg border-2 p-4 transition-colors', {
                'border-green-300 bg-green-50': answersChecked && attemptedQuestions[questionIndex]?.isCorrect,
                'border-red-300 bg-red-50':
                  answersChecked &&
                  attemptedQuestions[questionIndex] &&
                  !attemptedQuestions[questionIndex].isCorrect,
                'border-picton-blue-200 bg-picton-blue-50': !answersChecked,
              })
            "
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 :id="getQuestionId(questionIndex)" class="mb-3 text-lg text-picton-blue-700">
                  {{ questionIndex + 1 }}. {{ question.question }}
                </h3>
                <div
                  class="flex flex-col gap-1"
                  role="list"
                  :id="getOptionsId(questionIndex)"
                  :aria-label="ui.isSwahili ? `Chaguo za swali la ${questionIndex + 1}` : `Answer choices for question ${questionIndex + 1}`"
                >
                  <div
                    v-for="(option, optionIndex) in question.options"
                    :key="optionIndex"
                    role="listitem"
                    :id="getOptionId(questionIndex, option.id)"
                    class="flex items-start gap-2 text-base font-thin text-picton-blue-700"
                    style="font-family: var(--font-shaky-hand-some-comic);"
                  >
                    <p>{{ option.id }})</p>
                    <p>{{ option.text }}</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-center gap-2">
                <label :id="getInputLabelId(questionIndex)" :for="getInputId(questionIndex)" class="sr-only">
                  {{
                    ui.isSwahili
                      ? `Jibu la swali ${questionIndex + 1}`
                      : `Answer for question ${questionIndex + 1}`
                  }}
                </label>
                <Input
                  :id="getInputId(questionIndex)"
                  :model-value="allAnswers[questionIndex] || ''"
                  type="text"
                  maxlength="1"
                  inputmode="text"
                  autocapitalize="characters"
                  :disabled="answersChecked"
                  :aria-labelledby="getInputLabelId(questionIndex)"
                  :aria-describedby="`${activityInstructionsId} ${getOptionsId(questionIndex)} ${activityStatusId}`"
                  :class="
                    cn('h-12 w-12 rounded text-center text-2xl', {
                      'bg-green-200 text-green-700':
                        answersChecked && attemptedQuestions[questionIndex]?.isCorrect,
                      'bg-red-200 text-red-700':
                        answersChecked &&
                        attemptedQuestions[questionIndex] &&
                        !attemptedQuestions[questionIndex].isCorrect,
                      'bg-picton-blue-200': !answersChecked && !allAnswers[questionIndex],
                      'bg-lemon-200 text-lemon-700': !answersChecked && allAnswers[questionIndex],
                    })
                  "
                  @update:model-value="
                    (value) => handleAllAtOnceInputChange(questionIndex, String(value ?? ''))
                  "
                />

                <div
                  v-if="answersChecked && attemptedQuestions[questionIndex]"
                  :id="getQuestionStatusId(questionIndex)"
                  role="status"
                  :aria-label="getQuestionResultText(questionIndex)"
                  :class="
                    cn('flex h-8 w-8 items-center justify-center rounded-full', {
                      'bg-green-100': attemptedQuestions[questionIndex].isCorrect,
                      'bg-red-100': !attemptedQuestions[questionIndex].isCorrect,
                    })
                  "
                >
                  <span aria-hidden="true">
                    {{ attemptedQuestions[questionIndex].isCorrect ? "✓" : "✕" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        v-if="!answersChecked"
        class="ml-auto w-fit group gap-2"
        :disabled="!allQuestionsAnswered"
        :aria-describedby="activityInstructionsId"
        @click="checkAllAnswers"
      >
        <Icon
          icon="heroicons:sparkles"
          width="18"
          height="18"
          class="text-lemon-700 transition-transform duration-200 group-hover:scale-110 animate-pulse"
          aria-hidden="true"
        />
        {{ ui.checkAnswers }}
      </Button>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
            allAnswered = false;
          }
        }
      "
    />
  </section>
</template>
