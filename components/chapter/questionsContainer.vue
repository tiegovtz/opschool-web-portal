<script setup>
import questionsAnswers from "./questionsAnswers.vue";

// define Props
const props = defineProps({
  questions: {
    type: Array,
    required: true,
  },
  isAttemptingQuiz: {
    type: Boolean,
    default: false,
  },
  chaptersList: Number,
  chaptersNumber: Number,
  changeChapter: Function,
});

// Define states
const quizAttempt = reactive({
  totalQuestions: 0,
  answeredQuestions: 0,
  currentQuestion: 0,
  scored: 0,
  isAttempting: false,
  clickedAnswer: [],
  quizCompleted: false, // New property to track if the quiz is completed
});

// Result Scored Computed
const scoredComputed = computed(() => {
  return (quizAttempt.scored / quizAttempt.totalQuestions) * 100;
});

// Motivation Messages
const getMotivationMessage = (score) => {
  if (score >= 81) return "Excellent! Keep it up! 🎉";
  if (score >= 61) return "Great job! Aim higher! 💪";
  if (score >= 41) return "Good effort! Keep improving! 🌟";
  if (score >= 21) return "Don't give up! Keep practicing! 🚀";
  return "Keep trying! You can do it! 🔥";
};

// Function to set color based on score
const getScoreColor = (score) => {
  return {
    "text-green-500": score >= 81, // Excellent
    "text-blue-500": score >= 61 && score < 81, // Great
    "text-yellow-500": score >= 41 && score < 61, // Good
    "text-orange-500": score >= 21 && score < 41, // Needs improvement
    "text-red-500": score < 21, // Low score
  };
};

// Reset All Quiz
const resetQuiz = () => {
  // Check Student If Score above 50
  scoredComputed.value < 50
    ? props.changeChapter("R")
    : props.changeChapter("N");
  quizAttempt.totalQuestions = props.questions.length;
  quizAttempt.answeredQuestions = 0;
  quizAttempt.currentQuestion = 0;
  quizAttempt.scored = 0;
  quizAttempt.isAttempting = false;
  quizAttempt.quizCompleted = false;
  quizAttempt.clickedAnswer = [];
};

// Quize Attempt Answered Questions Function
const answeredAttempt = (isAnswered) => {
  // If Is answer the question
  if (isAnswered) {
    quizAttempt.scored++;
  }
  setTimeout(() => {
    // Increment answered questions only if not already answered
    if (quizAttempt.answeredQuestions < quizAttempt.currentQuestion + 1) {
      quizAttempt.answeredQuestions++;
    }

    // Move to next question if available
    if (quizAttempt.currentQuestion < props.questions.length - 1) {
      quizAttempt.currentQuestion++;
    }
  }, 800);
};

// shuffle Questions
const shuffleQuestions = computed(() => {
  return props.questions
    .map((question) => ({ question, sort: Math.random() })) // Assign a random sort key
    .sort((a, b) => a.sort - b.sort) // Sort by random key
    .map(({ question }) => question); // Extract shuffled choices
});

// Set total questions when component mounts
onMounted(() => {
  quizAttempt.totalQuestions = props.questions.length;
});

// Watch for quiz completion
watch(
  () => quizAttempt.answeredQuestions,
  (newQues) => {
    if (newQues) {
      if (
        quizAttempt.answeredQuestions === quizAttempt.totalQuestions &&
        quizAttempt.totalQuestions > 0
      ) {
        quizAttempt.isAttempting = true;
        quizAttempt.quizCompleted = true; // Set quiz as completed when all questions are answered
      }
    }
  }
);

// watch for questions changes
watch(
  () => props.questions,
  () => {
    resetQuiz();
  }
);

// watch progress QUIZ
// watch(quizAttempt.quizCompleted, (isCompleted) => {
//   if (isCompleted == true) {

//   }
// });
</script>

<template>
  <section
    class="flex flex-col items-center justify-center py-4 rounded-md bg-gradient-to-b from-deepBlue to-white center-height"
  >
    <!-- Questions -->
    <div
      class="container w-full max-w-5xl bg-white rounded-md md:p-8 custom-box-shadow"
      v-if="isAttemptingQuiz"
    >
      <!-- Close Button -->
      <div class="flex items-center justify-end mb-2">
        <div
          class="flex items-center justify-center w-8 h-8 p-2 bg-red-500 rounded-full cursor-pointer"
          @click="changeChapter('R')"
        >
          <Icon name="formkit:close" size="24" class="font-bold text-white" />
        </div>
      </div>

      <!-- Header and Button -->
      <div class="flex items-center justify-between">
        <h1
          class="tracking-wide underline text-large"
          v-if="questions.length > 0"
        >
          Quiz
        </h1>

        <!-- Answer and Read Notes again and Read Next Topic -->
        <div class="flex items-center justify-end gap-4">
          <!-- Simplified counter display -->
          <p class="flex gap-2 font-bold">
            Answered
            <span class="font-normal"
              >{{ quizAttempt.answeredQuestions }}/{{ questions.length }}</span
            >
          </p>
        </div>
      </div>

      <!-- Outputs or results or Marks -->
      <div
        v-if="quizAttempt.quizCompleted && quizAttempt.isAttempting"
        class="w-full"
      >
        <!-- Scores -->
        <div class="flex flex-col items-center w-full mb-4">
          <p>
            Scores: <b>{{ scoredComputed.toFixed(1) }}%</b>
          </p>
          <p
            class="flex items-center justify-center flex-1 gap-2 font-bold"
            :class="getScoreColor(scoredComputed)"
          >
            {{ getMotivationMessage(scoredComputed) }}
          </p>
        </div>

        <!-- Question with Answers -->
        <div
          class="flex items-center w-full gap-2 my-2"
          v-for="(question, index) in shuffleQuestions"
          :key="index"
        >
          <div class="flex w-full">
            <p class="flex">{{ index + 1 }}.</p>
            <div class="pl-4 text-justify">
              <p class="mb-2">
                {{ 
                  question.questionType === 'drag_and_drop'
                  ? question.question.replace(/(_\$blank)/g, '..........')
                  : question.question 
                }}
            </p>
              <p
                :class="
                  quizAttempt.clickedAnswer[index] == question.answer
                    ? 'text-normalGreener'
                    : 'text-red-600'
                "
              >
                <b :class="['text-black',{'capitalize':question.questionType === 'drag_and_drop'}]">Your choice: </b>
                <span :class="[ question.questionType === 'drag_and_drop'?'capitalize':'']">{{ quizAttempt.clickedAnswer[index].replaceAll('-', ' ,') }}</span>

                <!-- Mark Tick and Wrong -->
                <span
                  v-if="quizAttempt.clickedAnswer[index] == question.answer"
                  class="font-bold text-normalGreener"
                  >✓</span
                >
                <span v-else class="font-bold text-red-600">✗</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Read notes again and Read next topic -->
        <div class="flex items-center justify-end w-full gap-2">
          <small>Recommendation:</small>
          <button
            v-if="quizAttempt.quizCompleted"
            @click="resetQuiz()"
            class="flex items-center justify-center px-4 py-1 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue"
          >
            <span v-if="scoredComputed < 50" class="capitalize"
              >Read notes again</span
            >
            <span v-else class="capitalize">next topic</span>
          </button>
        </div>

        <!-- Next and Previous chapter Action -->
        <!-- <div class="flex flex-row-reverse items-center justify-between pt-4"> -->
        <!-- Next Chapter -->
        <!-- <button @click="changeChapter('n')" :disabled="chaptersNumber == chaptersList"
                        :class="{ 'opacity-0': chaptersNumber == chaptersList }"
                        class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                        <p class="flex gap-2 capitalize">Next <span class="hidden md:flex">Chapter</span></p>
                        <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                            <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue" />
                        </div>
                    </button> -->
        <!-- Previous Chapter -->
        <!-- <button @click="changeChapter('p')" :disabled="chaptersNumber <= 1"
                        :class="{ 'opacity-0': chaptersNumber <= 1 }"
                        class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                        <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                            <Icon name="weui:arrow-filled" size="20" class="transform rotate-180 text-oceanBlue" />
                        </div>
                        <p class="flex gap-2 capitalize">Previous <span class="hidden md:flex">Chapter</span></p>
                    </button> -->
        <!-- </div> -->
      </div>

      <!-- Use currentQuestion instead of shuffleQuestions to determine which question to display -->
      <questionsAnswers
        v-else
        @question-answered="answeredAttempt($event)"
        @clicked-choice="quizAttempt.clickedAnswer.push($event)"
        :question-type="
          shuffleQuestions[quizAttempt.currentQuestion].questionType
        "
        :thumbnail="shuffleQuestions[quizAttempt.currentQuestion].thumbnail"
        :true-answer="shuffleQuestions[quizAttempt.currentQuestion].answer"
        :choices="shuffleQuestions[quizAttempt.currentQuestion].choices"
        :question="shuffleQuestions[quizAttempt.currentQuestion].question"
        :number="`${quizAttempt.currentQuestion + 1}`.toString()"
      />
    </div>
  </section>
</template>
