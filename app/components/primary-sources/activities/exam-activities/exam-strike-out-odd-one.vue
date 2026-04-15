<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ActivityTitle from "~/components/templates/activity-title";
import { cn } from "~/utilities/utils";
import { useExamContext } from "~/shared/context/exam-context";

type Word = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  words: Word[];
};

type UserSelection = {
  questionId: string;
  selectedWordId: string | null;
};

type ExamStrikeOutOddOneProps = {
  questions: {
    title: string;
    questions: Question[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamStrikeOutOddOneProps>();

const ui = useActivityUiText();
const userSelections = ref<UserSelection[]>(
  props.questions.questions.map((question) => ({
    questionId: question.id,
    selectedWordId: null,
  })),
);
const activityInstructionsId = "exam-strike-out-instructions";

const { collectAnswers, updateActivityScore } = useExamContext();

const totalQuestions = computed(() => props.questions.questions.length);

const calculateScore = () => {
  let score = 0;

  props.questions.questions.forEach((question) => {
    const selection = userSelections.value.find((item) => item.questionId === question.id);
    const selectedWord = question.words.find((word) => word.id === selection?.selectedWordId);

    if (selectedWord?.isCorrect) {
      score++;
    }
  });

  return { score };
};

watch(
  userSelections,
  () => {
    const answeredCount = userSelections.value.filter((selection) => selection.selectedWordId !== null).length;
    props.onStateUpdate?.(totalQuestions.value, answeredCount);
  },
  { deep: true },
);

watch(
  [userSelections, collectAnswers],
  () => {
    if (!collectAnswers.value || !userSelections.value.length) return;

    const { score } = calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
    });
  },
  { deep: true },
);

const handleWordClick = (questionId: string, wordId: string) => {
  userSelections.value = userSelections.value.map((selection) => {
    if (selection.questionId !== questionId) {
      return selection;
    }

    return {
      ...selection,
      selectedWordId: selection.selectedWordId === wordId ? null : wordId,
    };
  });
};

const getUserSelection = (questionId: string) =>
  userSelections.value.find((selection) => selection.questionId === questionId);

const isWordSelected = (questionId: string, wordId: string) =>
  getUserSelection(questionId)?.selectedWordId === wordId;

const isQuestionAnswered = (questionId: string) =>
  getUserSelection(questionId)?.selectedWordId !== null;

const gridClass = (wordCount: number) => {
  if (wordCount <= 1) return "grid-cols-1";
  if (wordCount === 2) return "grid-cols-2";
  if (wordCount === 3) return "grid-cols-3";
  if (wordCount === 4) return "grid-cols-4";
  return "grid-cols-4";
};
</script>

<template>
  <section
    class="flex h-full flex-col rounded-b-xl bg-white shadow-sm"
    aria-labelledby="exam-strike-out-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="exam-strike-out-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila kundi la maneno. Tumia enter au space kuchagua neno lisilofaa."
          : "Use Tab to move through each word group. Use Enter or Space to choose the odd word out."
      }}
    </p>
    <div class="flex-1 overflow-y-auto p-6">
      <div class="space-y-6" role="list" :aria-label="ui.question.value">
        <div
          v-for="(question, questionIndex) in props.questions.questions"
          :key="question.id"
          :class="
            cn(
              'flex items-center gap-6 rounded-lg border p-6 transition-colors',
              isQuestionAnswered(question.id)
                ? 'border-picton-blue-200 bg-picton-blue-50'
                : 'border-gray-200 bg-gray-50',
            )
          "
          role="listitem"
          :aria-labelledby="`exam-strike-out-question-${question.id}`"
        >
          <div
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                isQuestionAnswered(question.id)
                  ? 'bg-picton-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600',
              )
            "
          >
            {{ questionIndex + 1 }}
          </div>

          <div
            :id="`exam-strike-out-question-${question.id}`"
            :class="cn('grid flex-1 gap-4', gridClass(question.words.length))"
            role="group"
            :aria-label="ui.isSwahili ? `Swali la ${questionIndex + 1}` : `Question ${questionIndex + 1}`"
          >
            <button
              v-for="(word, wordIndex) in question.words"
              :key="word.id"
              type="button"
              :aria-pressed="isWordSelected(question.id, word.id)"
              :aria-label="ui.isSwahili ? `Swali la ${questionIndex + 1}, neno la ${wordIndex + 1}: ${word.text}` : `Question ${questionIndex + 1}, word ${wordIndex + 1}: ${word.text}`"
              :class="
                cn(
                  'relative flex min-h-[60px] items-center justify-center rounded-lg border p-4 text-center font-medium shadow-sm transition-all duration-300 hover:shadow-md',
                  isWordSelected(question.id, word.id)
                    ? 'border-gray-400 bg-gray-200 text-gray-700'
                    : 'border-gray-300 bg-white hover:border-picton-blue-300 hover:bg-picton-blue-50',
                )
              "
              @click="handleWordClick(question.id, word.id)"
            >
              <span :class="cn('text-lg', { 'line-through': isWordSelected(question.id, word.id) })">
                {{ word.text }}
              </span>
              <div
                v-if="isWordSelected(question.id, word.id)"
                class="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-red-500"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
