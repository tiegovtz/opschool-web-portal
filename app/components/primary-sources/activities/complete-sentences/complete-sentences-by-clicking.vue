<script setup lang="tsx">
import { ref, computed, watch, onMounted } from "vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, { ActivityResultsAlertDialog } from "@/components/templates/results";
import { Button } from "~/components/ui/button";
import { cn,shuffle } from "~/utilities/utils";

// Props
type Question = {
  id: number | string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    questions: Question[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();

// State
const shuffledQuestions = ref<Question[]>([]);
const crossedOptions = ref<Record<number, string[]>>({});
const showResults = ref(false);
const isSubmitted = ref(false);
const activityInstructionsId = "complete-sentences-clicking-instructions";

// Shuffle questions initially
function shuffleQuestions() {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
}

// Initial shuffle on mount
onMounted(() => {
  shuffleQuestions();
});

// Check if all questions are answered (at least one option crossed per question)
const allAnswered = computed(() =>
  Object.keys(crossedOptions.value).length === shuffledQuestions.value.length &&
  shuffledQuestions.value.every((_, index) => (crossedOptions.value as any[])[index]?.length > 0)
);

// Calculate score based on the remaining uncrossed option being user's answer
const score = computed(() =>
  shuffledQuestions.value.reduce((acc, q, index) => {
    const crossed = crossedOptions.value[index] || [];
    if (!crossed.length) return acc;
    const userAnswer = q.options.find((opt) => !crossed.includes(opt)) || "";
    return acc + (userAnswer === q.correctAnswer ? 1 : 0);
  }, 0)
);

// Reset function with shuffle
function handleResetWithShuffle() {
  shuffleQuestions();
  crossedOptions.value = {};
  showResults.value = false;
  isSubmitted.value = false;
}

// Submit answers
function handleCheckAnswers() {
  isSubmitted.value = true;
}

// Handle option click
function handleOptionClick(questionIndex: number, option: string) {
  if (showResults.value) return;

  const current = crossedOptions.value[questionIndex] || [];
  const isCrossed = current.includes(option);

  const uncrossedCount =
    (shuffledQuestions.value as any[])[questionIndex].options.filter(
      (opt:any) => !current.includes(opt)
    ).length;

  if (isCrossed) {
    crossedOptions.value[questionIndex] = current.filter((o) => o !== option);
  } else if (uncrossedCount > 1) {
    crossedOptions.value[questionIndex] = [...current, option];
  }
}

// Render question
function renderQuestion(question: Question, questionIndex: number) {
  const parts = question.question.split("___");
  const crossed = crossedOptions.value[questionIndex] || [];
  const isAnswered = crossed.length > 0;
  const userAnswer = isAnswered
    ? question.options.find((opt) => !crossed.includes(opt)) || ""
    : "";
  const isCorrect = showResults.value && userAnswer === question.correctAnswer;
  const isIncorrect = showResults.value && userAnswer !== question.correctAnswer;

  return (
    <div
      key={questionIndex}
      class={cn(
        "flex items-center p-2 md:p-4 rounded mb-2",
        {
          "bg-picton-blue-50": !showResults.value,
          "bg-green-100": isCorrect,
          "bg-red-100": isIncorrect,
        }
      )}
    >
      <div class="flex w-full justify-between items-center">
        <p>
          {questionIndex + 1}. {parts[0]}
          <span class="inline-flex gap-2">
            {question.options.map((option) => {
              const isCrossed = crossed.includes(option);
              const isUserAnswer = isAnswered && !isCrossed;
              const uncrossedCount =
                question.options.filter((o) => !crossed.includes(o)).length;
              const canCross = !isCrossed && uncrossedCount > 1;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionClick(questionIndex, option)}
                  disabled={showResults.value}
                  aria-pressed={isCrossed}
                  class={cn(
                    "px-1 py-1 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2",
                    {
                      "bg-picton-blue-200 hover:bg-picton-blue-300":
                        !showResults.value && (canCross || isCrossed),
                      "line-through text-gray-400": isCrossed,
                      "bg-lemon-200 text-lemon-700 hover:bg-lemon-300":
                        isUserAnswer && !showResults.value,
                      "bg-green-200 text-green-700":
                        showResults.value && isUserAnswer && isCorrect,
                      "bg-red-200 text-red-700":
                        showResults.value && isUserAnswer && isIncorrect,
                      "cursor-not-allowed":
                        !showResults.value && !canCross && !isCrossed,
                    }
                  )}
                >
                  {option}
                </button>
              );
            })}
          </span>
          {parts[1]}
        </p>
      </div>
    </div>
  );
}
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-clicking-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-clicking-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Tumia kitufe cha Tab kupita kwenye chaguo za majibu. Bonyeza Enter au Space kufuta au kurejesha neno. Kila swali likibaki na jibu moja, tumia kitufe cha Kagua Majibu."
        : "Use the Tab key to move between answer choices. Press Enter or Space to cross out or restore a word. When each question has one answer left, use the Check Answers button." }}
    </p>

    <div
      class="flex flex-col gap-2 h-full bg-picton-blue-100 text-[20px]"
      :style="{ fontSize: props.questions.fontSize ? props.questions.fontSize + 'px' : undefined }"
    >
      <div class="md:p-4 overflow-y-auto" role="list" :aria-label="ui.completeSentenceQuestions.value">
        <div v-for="(q, idx) in shuffledQuestions" :key="q.id">
          <component :is="renderQuestion(q, idx)" />
        </div>

        <ActivityResults
          v-if="showResults"
          :score="score"
          :total="shuffledQuestions.length"
          @onRestart="handleResetWithShuffle"
          class="mt-6"
        />

        <div v-if="allAnswered && !showResults" class="ml-auto w-fit">
          <Button variant="brand-lemon" :onClick="handleCheckAnswers" :aria-describedby="activityInstructionsId">
            {{ ui.checkAnswers }}
          </Button>
        </div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="isSubmitted && !showResults"
      @onOpenChange="(open:any) => { if (!open) showResults = true }"
    />
  </section>
</template>
