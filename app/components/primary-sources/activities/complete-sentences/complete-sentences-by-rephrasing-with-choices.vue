<script setup lang="tsx">
import { ref, reactive, computed, watchEffect } from "vue";
import { Icon } from "@iconify/vue";

// Local imports
import ActivityTitle from "@/components/templates/activity-title";
import { Input } from "@/components/ui/input";
import ActivityResults,{ActivityResultsAlertDialog} from "@/components/templates/results";
import { shuffle } from "~/utilities/utils";
import { Button } from "~/components/ui/button";

// Types
interface QuestionItem {
  question: string;
  answer: string;
}

interface QuestionsProps {
  title: string;
  fontSize?: number;
  options: string[];
  questions: QuestionItem[];
}

interface Props {
  feedback: "none" | "wrong-correct" | "wrong-correct-answers";
  questions: QuestionsProps;
}

// Props
const props = defineProps<Props>();

// State
const shuffledQuestions = ref([...props.questions.questions]);
const answers = reactive<{ [key: number]: string }>({});
const feedbacks = reactive<{ [key: number]: boolean }>({});
const checkedItems = ref<number[]>([]);
const allAnswered = ref(false);
const showResults = ref(false);
const score = ref(0);

// Computed
const allQuestionsAnswered = computed(() =>
  shuffledQuestions.value.every((_, index) => answers[index]?.trim() !== "")
);

// Shuffle questions on mount
watchEffect(() => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
});

// Handlers
const handleInputChange = (index: number, value: string) => {
  answers[index] = value;
};

const checkAnswer = (userAnswer: string, questionIndex: number) => {
  const correctAnswer = (shuffledQuestions.value as any[])[questionIndex].answer.toLowerCase();
  return userAnswer.toLowerCase().trim() === correctAnswer;
};

const handleCheckAllAnswers = () => {
  let newScore = 0;
  shuffledQuestions.value.forEach((_, index) => {
    const userAnswer = answers[index] || "";
    const isCorrect = checkAnswer(userAnswer, index);
    feedbacks[index] = isCorrect;
    checkedItems.value.push(index);
    if (isCorrect) newScore++;
  });

  score.value = newScore;
  allAnswered.value = true;
  // Optionally play success/failure sound
};

const handleReset = () => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
  Object.keys(answers).forEach((k) => delete answers[+k]);
  Object.keys(feedbacks).forEach((k) => delete feedbacks[+k]);
  checkedItems.value = [];
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
};

const renderQuestionWords = (q: string, questionIndex: number) => {
  return q.split(" ").map((word, i) => {
    if (word.startsWith("___")) {
      const underscoreCount = word.length;
      const widthMultiplier = underscoreCount / 3;
      const baseWidth = 200;
      const calculatedWidth = baseWidth * widthMultiplier;
      return (
        <span class="inline-flex flex-col mx-1" style={{ minWidth: `${calculatedWidth}px` }}>
          <Input
            modelValue={answers[questionIndex] || ""}
            onUpdate:modelValue={(val) => handleInputChange(questionIndex, val)}
            disabled={checkedItems.value.includes(questionIndex)}
            class="min-w-0 px-2 border-none bg-transparent text-center focus:outline-none"
            style={{ maxWidth: `${calculatedWidth * 1.6}px` }}
          />
          <div
            class={["border-b border-dashed border-picton-blue-700", { "border-lemon-700": checkedItems.value.includes(questionIndex) }]}
          />
        </span>
      );
    }
    return (
      <span
        class={["inline-flex items-center mx-1", { "bg-lemon-100 text-lemon-700 px-2 py-1 rounded": word.includes("_") && word.split("_").length === 2 }]}
        key={i}
      >
        {word.replace(/_/g, "")}
      </span>
    );
  });
};
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="!showResults"
      class="flex flex-col h-full bg-picton-blue-100"
      :style="{ fontSize: props.questions.fontSize ? props.questions.fontSize + 'px' : '20px' }"
    >
      <div class="grid gap-4 py-4 h-full grow overflow-y-auto">
        <div
          v-for="(q, i) in shuffledQuestions"
          :key="i"
          :class="[
            'h-full rounded-lg p-4 flex flex-col justify-between',
            !checkedItems.includes(i)
              ? 'bg-picton-blue-50'
              : feedbacks[i]
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          ]"
        >
          <div class="flex flex-wrap items-center">
            <template v-for="(word, wi) in renderQuestionWords(q.question, i)" :key="wi">
              <component :is="word" />
            </template>
          </div>

          <div class="flex items-center gap-2 mt-4 ml-auto">
            <div
              v-if="checkedItems.includes(i)"
              :class="['flex items-center justify-center rounded-full p-1', feedbacks[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']"
            >
              <Icon :icon="feedbacks[i] ? 'mdi:check' : 'mdi:close'" width="20" height="20" />
            </div>
          </div>
        </div>
      </div>

      <Button :disabled="!allQuestionsAnswered || allAnswered" @click="handleCheckAllAnswers" variant="brand-lemon" class="w-fit ml-auto" size="lg">
        {{ allAnswered ? "Answers Checked" : "Check All Answers" }}
      </Button>
    </div>

    <div v-else class="flex flex-col h-full bg-picton-blue-100 p-6 overflow-y-auto">
      <div class="bg-picton-blue-50 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div v-for="(question, idx) in shuffledQuestions" :key="idx" :class="['p-4 rounded-lg border', checkAnswer(answers[idx] || '', idx) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200']">
            <div class="flex justify-between items-center mb-2">
              <p class="font-medium">{{ question.question }}</p>
              <div :class="['flex items-center justify-center rounded-full p-1', checkAnswer(answers[idx] || '', idx) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']">
                <Icon :icon="checkAnswer(answers[idx] || '', idx) ? 'mdi:check' : 'mdi:close'" width="20" height="20" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p class="text-sm text-gray-500">Your answer:</p>
                <p :class="{ 'text-red-600': !checkAnswer(answers[idx] || '', idx) }">{{ answers[idx] || "(no answer)" }}</p>
              </div>
              <div v-if="props.feedback === 'wrong-correct-answers'">
                <p class="text-sm text-gray-500">Correct answer:</p>
                <p class="text-green-600">{{ question.answer }}</p>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults :score="score" :total="shuffledQuestions.length" @restart="handleReset" />
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="allAnswered && !showResults"
      @update:open="(open:any) => { if (!open) showResults = true }"
    />
  </div>
</template>