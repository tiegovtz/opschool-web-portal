<script setup>
import questionsAnswers from './questionsAnswers.vue';

// Define states
const quizAttempt = reactive({
    totalQuestions: 0,
    answeredQuestions: 0,
    currentQuestion: 0,
    scored: 0,
    isAttempting: false,
    quizCompleted: false // New property to track if the quiz is completed
})

// Result Scored Computed
const scoredComputed = computed(
    () => {
        return (quizAttempt.scored / quizAttempt.totalQuestions) * 100;
    }
);

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
    quizAttempt.totalQuestions = props.questions.length;
    quizAttempt.answeredQuestions = 0;
    quizAttempt.currentQuestion = 0;
    quizAttempt.scored = 0;
    quizAttempt.isAttempting = false;
    quizAttempt.quizCompleted = false;
}

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
    changeChapter: Function
})

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
    }, 1000)
}

// shuffle Questions
const shuffleQuestions = computed(() => {
    return props.questions
        .map(question => ({ question, sort: Math.random() })) // Assign a random sort key
        .sort((a, b) => a.sort - b.sort) // Sort by random key
        .map(({ question }) => question); // Extract shuffled choices
})

// Set total questions when component mounts
onMounted(() => {
    quizAttempt.totalQuestions = props.questions.length;
})

// Watch for quiz completion
watch(() => quizAttempt.answeredQuestions, (newQues) => {
    if (newQues) {
        if (quizAttempt.answeredQuestions === quizAttempt.totalQuestions && quizAttempt.totalQuestions > 0) {
            quizAttempt.isAttempting = true;
            quizAttempt.quizCompleted = true; // Set quiz as completed when all questions are answered
        }
    }
});

// watch for questions changes
watch(()=>props.questions,() => {
    resetQuiz()
});
</script>

<template>
    <section class="flex flex-col items-center justify-center px-4 max-w-7xl container" v-if="isAttemptingQuiz">
        <!-- Questions -->
        <div class="w-full bg-white p-4">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-large underline tracking-wide" v-if="questions.length > 0">Quiz</h1>

                <div class="flex items-center justify-end gap-4">
                    <!-- Simplified counter display -->
                    <p class="flex gap-2 font-bold">
                        Answered
                        <span class="font-normal">{{ quizAttempt.answeredQuestions }}/{{ questions.length }}</span>
                    </p>

                    <!-- Retry Button - now uses quizCompleted to determine visibility -->
                    <button v-if="quizAttempt.quizCompleted" @click="resetQuiz()"
                        class="flex items-center justify-center px-4 py-1 rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue text-white transition-colors duration-500 ease-in-out">
                        Try again
                    </button>
                </div>
            </div>

            <!-- Outputs or results or Marks -->
            <div v-if="quizAttempt.quizCompleted && quizAttempt.isAttempting" class="w-full">
                <!-- Output -->
                <div class="flex w-full mb-4">
                    <p>Marks: {{ scoredComputed.toFixed(1) }}%</p>
                    <p class="flex flex-1 items-center justify-center gap-2 font-bold" :class="getScoreColor(scoredComputed)">
                        {{ getMotivationMessage(scoredComputed) }}
                    </p>
                </div>

                <div class="flex items-center w-full gap-2 my-2" v-for="(question, index) in questions" :key="index">
                    <div class="flex w-full">
                        <p class="flex">{{ index + 1 }}.</p>
                        <div class="pl-4 text-justify">
                            <p class="mb-2">{{ question.question }}</p>
                            <p class=""><span class="font-medium">Answer:</span> <span class="text-green-600">{{
                                    question.answer }}</span></p>
                        </div>
                    </div>
                </div>

                <!-- Next and Previous chapter Action -->
                <!-- <div class="flex flex-row-reverse items-center justify-between pt-4"> -->
                    <!-- Next Chapter -->
                    <!-- <button @click="changeChapter('n')" :disabled="chaptersNumber == chaptersList"
                        :class="{ 'opacity-0': chaptersNumber == chaptersList }"
                        class="flex items-center justify-center gap-4 bg-oceanBlue hover:bg-deepBlue rounded-md h-10 px-4 text-white">
                        <p class="capitalize flex gap-2">Next <span class="hidden md:flex">Chapter</span></p>
                        <div class="flex items-center justify-center h-4 w-4 rounded-full bg-white animate-bounce-horizontal">
                            <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue" />
                        </div>
                    </button> -->
                    <!-- Previous Chapter -->
                    <!-- <button @click="changeChapter('p')" :disabled="chaptersNumber <= 1"
                        :class="{ 'opacity-0': chaptersNumber <= 1 }"
                        class="flex items-center justify-center gap-4 bg-oceanBlue hover:bg-deepBlue rounded-md h-10 px-4 text-white">
                        <div class="flex items-center justify-center h-4 w-4 rounded-full bg-white animate-bounce-horizontal">
                            <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue transform rotate-180" />
                        </div>
                        <p class="capitalize flex gap-2">Previous <span class="hidden md:flex">Chapter</span></p>
                    </button> -->
                <!-- </div> -->
            </div>

            <!-- Use currentQuestion instead of shuffleQuestions to determine which question to display -->
            <questionsAnswers v-else @question-answered="answeredAttempt($event)"
                :question-type="shuffleQuestions[quizAttempt.currentQuestion].questionType"
                :true-answer="shuffleQuestions[quizAttempt.currentQuestion].answer"
                :choices="shuffleQuestions[quizAttempt.currentQuestion].choices"
                :question="shuffleQuestions[quizAttempt.currentQuestion].question"
                :number="`${quizAttempt.currentQuestion + 1}`.toString()" />
        </div>
    </section>
</template>