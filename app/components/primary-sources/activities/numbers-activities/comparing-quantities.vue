<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { QuantityRenderer } from "./shared";
import AnswerDropZone from "./shared/answer-drop-zone.vue";
import ActivityTitle from "~/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import type { FeedbackType } from "~/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { cn } from "~/utilities/utils";

type ComparingQuantitiesProps = {
  questions: {
    title: string;
    questions: {
      answer: "Second" | "First";
      leftNumber: number;
      leftImage: string;
      rightNumber: number;
    }[];
  };
  feedback: FeedbackType;
};

const props = defineProps<ComparingQuantitiesProps>();

const score = ref(0);
const showResults = ref(false);
const allAnswered = ref(false);
const questionAnswers = reactive<Record<number, "" | "First" | "Second">>({});
const correctAnswers = ref<string[]>([]);
const activityInstructionsId = "numbers-comparing-quantities-instructions";
const ui = useActivityUiText();

const { playSound } = useSoundEffects();

const totalQuestions = computed(() => props.questions.questions.length);

const initAnswers = () => {
  props.questions.questions.forEach((_, index) => {
    questionAnswers[index] = "";
  });
};

onMounted(initAnswers);
watch(() => props.questions, initAnswers, { deep: true });

watch(
  () => ({ ...questionAnswers }),
  () => {
    const answeredCount = Object.keys(questionAnswers).filter((k) => !!questionAnswers[Number(k)]).length;
    if (answeredCount !== totalQuestions.value || totalQuestions.value === 0) return;

    let totalScore = 0;
    const correct: string[] = [];
    props.questions.questions.forEach((question, index) => {
      const userAnswer = questionAnswers[index];
      if (userAnswer === question.answer) {
        totalScore += 1;
        correct.push(index.toString());
      }
    });

    score.value = totalScore;
    correctAnswers.value = correct;
    allAnswered.value = true;
    playSound("success");
  },
  { deep: true },
);

const handleAnswerClick = (questionIndex: number, side: "First" | "Second") => {
  questionAnswers[questionIndex] = side;
  playSound("click");
};

const resetActivity = () => {
  score.value = 0;
  showResults.value = false;
  allAnswered.value = false;
  correctAnswers.value = [];
  initAnswers();
};

const isCorrect = (questionIndex: number) =>
  correctAnswers.value.includes(questionIndex.toString());

const renderQuantityImages = (count: number, image: string) => ({
  count,
  image,
  maxItemsPerRow: 7,
  className: "sm:max-w-[350px] xl:max-w-full flex-wrap",
});
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="numbers-comparing-quantities-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="numbers-comparing-quantities-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila jozi ya picha. Chagua First au Second kwa enter au space."
          : "Use Tab to move through each picture pair. Choose First or Second with Enter or Space."
      }}
    </p>

    <div class="flex-1 flex flex-col gap-6 overflow-y-auto p-4">
      <div class="space-y-6">
        <div
          v-for="(question, index) in props.questions.questions"
          :key="index"
          class="bg-white rounded-lg p-6 mb-6"
          :aria-labelledby="`comparing-quantities-question-${index}`"
        >
          <h3 :id="`comparing-quantities-question-${index}`" class="sr-only">
            {{ ui.isSwahili ? `Swali la ${index + 1}` : `Question ${index + 1}` }}
          </h3>
          <div class="flex flex-col md:flex-row items-center justify-between gap-8">
            <div class="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
              <QuantityRenderer
                v-bind="renderQuantityImages(question.leftNumber, question.leftImage)"
                :summary-label="ui.isSwahili ? `Kundi la kwanza lina vitu ${question.leftNumber}` : `First group has ${question.leftNumber} items`"
              />

              <div class="relative w-fit ml-auto">
                <AnswerDropZone
                  :id="`${index}-left`"
                  answerType="click"
                  :currentAnswer="questionAnswers[index]"
                  :correctAnswer="question.answer"
                  :showResults="showResults"
                  placeholder="Select"
                  :onClickChange="() => handleAnswerClick(index, 'First')"
                  :isSelected="questionAnswers[index] === 'First'"
                  :ariaLabel="ui.isSwahili ? `Swali la ${index + 1}, chagua kundi la kwanza` : `Question ${index + 1}, choose the first group`"
                  :className="
                    `min-w-[120px] ${
                      showResults && questionAnswers[index] === 'First'
                        ? isCorrect(index)
                          ? 'bg-green-200 text-green-700 border-green-300'
                          : 'bg-red-200 text-red-700 border-red-300'
                        : questionAnswers[index] === 'First'
                          ? 'bg-picton-blue-200 border-picton-blue-400'
                          : ''
                    }`
                  "
                >
                  First
                </AnswerDropZone>

                <div v-if="showResults && questionAnswers[index] === 'First'" class="absolute -top-2 -right-2 z-10">
                  <span
                    :class="cn('h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center', isCorrect(index) ? 'text-green-600' : 'text-red-600')"
                  >
                    {{ isCorrect(index) ? "✓" : "✕" }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
              <div class="relative w-fit ml-auto">
                <AnswerDropZone
                  :id="`${index}-right`"
                  answerType="click"
                  :currentAnswer="questionAnswers[index]"
                  :correctAnswer="question.answer"
                  :showResults="showResults"
                  placeholder="Select"
                  :onClickChange="() => handleAnswerClick(index, 'Second')"
                  :isSelected="questionAnswers[index] === 'Second'"
                  :ariaLabel="ui.isSwahili ? `Swali la ${index + 1}, chagua kundi la pili` : `Question ${index + 1}, choose the second group`"
                  :className="
                    `min-w-[120px] ${
                      showResults && questionAnswers[index] === 'Second'
                        ? isCorrect(index)
                          ? 'bg-green-200 text-green-700 border-green-300'
                          : 'bg-red-200 text-red-700 border-red-300'
                        : questionAnswers[index] === 'Second'
                          ? 'bg-picton-blue-200 border-picton-blue-400'
                          : ''
                    }`
                  "
                >
                  Second
                </AnswerDropZone>

                <div v-if="showResults && questionAnswers[index] === 'Second'" class="absolute -top-2 -right-2 z-10">
                  <span
                    :class="cn('h-6 w-6 bg-white rounded-full p-1 inline-flex items-center justify-center', isCorrect(index) ? 'text-green-600' : 'text-red-600')"
                  >
                    {{ isCorrect(index) ? "✓" : "✕" }}
                  </span>
                </div>
              </div>

              <QuantityRenderer
                v-bind="renderQuantityImages(question.rightNumber, question.leftImage)"
                :summary-label="ui.isSwahili ? `Kundi la pili lina vitu ${question.rightNumber}` : `Second group has ${question.rightNumber} items`"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="showResults" class="mt-4">
        <ActivityResults :score="score" :total="totalQuestions" :onRestart="resetActivity" />
      </div>

      <ActivityResultsAlertDialog
        :score="score"
        :total="totalQuestions"
        :open="allAnswered"
        :onOpenChange="(open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') resetActivity();
            else showResults = true;
            allAnswered = false;
          }
        }"
      />
    </div>
  </section>
</template>
