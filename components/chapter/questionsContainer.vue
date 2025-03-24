<script setup>
import questionsAnswers from './questionsAnswers.vue';

// Define states
const quizAttempt = reactive({
    totalQuestions: 0,
    answeredQuestions: 0,
    currentQuestion: 0, // Add a new property to track the current question
    scored: 0,
    isAttempting: false,
})

// define Props
const props = defineProps({
    questions: {
        type: Array,
        required: true,
    }
})

// Quize Attempt Answered Questions Function
const answeredAttempt = () => {
   setTimeout(()=>{
     // Increment answered questions only if not already answered
     if (quizAttempt.answeredQuestions < quizAttempt.currentQuestion + 1) {
        quizAttempt.answeredQuestions++;
    }
    
    // Move to next question if available
    if (quizAttempt.currentQuestion < props.questions.length - 1) {
        quizAttempt.currentQuestion++;
    }
   },2000)
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
</script>

<template>
    <section class="">
        <div v-if="quizAttempt.isAttempting">
            <div class="flex items-center justify-between">
                <h1 class="text-large underline tracking-wide" v-if="questions.length > 0">Question</h1>
                <div class="flex items-center">
                    <!-- Simplified counter display -->
                    <p class="flex gap-2 font-bold">
                        Answered
                        <span class="font-normal">{{quizAttempt.answeredQuestions}}/{{ questions.length }}</span>
                    </p>
                </div>
            </div>
            <!-- Use currentQuestion instead of shuffleQuestions to determine which question to display -->
            <questionsAnswers 
                @question-answered="answeredAttempt()"
                :question-type="shuffleQuestions[quizAttempt.currentQuestion].questionType"
                :true-answer="shuffleQuestions[quizAttempt.currentQuestion].answer"
                :choices="shuffleQuestions[quizAttempt.currentQuestion].choices"
                :question="shuffleQuestions[quizAttempt.currentQuestion].question"
                :number="`${quizAttempt.currentQuestion + 1}`.toString()"
            />
        </div>
        <div v-else class="">
         <button class="bg-oceanBlue hover:bg-deepBlue px-4 text-white h-10 rounded-md cursor-pointer transition-colors duration-500 ease-in-out uppercase" @click="quizAttempt.isAttempting = true;">
            Attempt This Quiz
         </button>
        </div>
    </section>
</template>