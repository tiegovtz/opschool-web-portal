<script setup>
// define states
const questionAnswer = reactive({
    disableAnswer: false,  // Prevents multiple answers
    isAnswered: false,     // Indicates if an answer was chosen
    selectedChoice: "",    // Stores the selected choice
    isCorrectAnswer: false // True if the chosen answer is correct
});

// Define Question Props
const questionProps = defineProps({
    questionType: String,
    question: String,
    trueAnswer: String,
    choices: Array,
    number: String,
});

// Define emits
const emit = defineEmits(['questionAnswered']);

// Function to check if a selected choice is correct
const markQuestion = (choice) => {
    if (questionAnswer.disableAnswer) return; // Prevent multiple selections

    questionAnswer.selectedChoice = choice;
    questionAnswer.isAnswered = true;
    questionAnswer.isCorrectAnswer = choice === questionProps.trueAnswer;
    questionAnswer.disableAnswer = true; // Disable further clicks

    emit('questionAnswered', questionAnswer.isCorrectAnswer);

    // Reset after 2 seconds
    setTimeout(() => {
        questionAnswer.isAnswered = false;
        questionAnswer.selectedChoice = "";
        questionAnswer.isCorrectAnswer = false;
        questionAnswer.disableAnswer = false;
    }, 1000);
};

// Function to convert index to alphabetic character (0 -> A, 1 -> B, etc.)
const indexToAlpha = (index) => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
};

// Shuffle choices
const shuffleChoices = computed(() => {
    return questionProps.choices
        .map(choice => ({ choice, sort: Math.random() })) // Assign a random sort key
        .sort((a, b) => a.sort - b.sort) // Sort by random key
        .map(({ choice }) => choice); // Extract shuffled choices
});
</script>

<template>
    <section class="flex flex-col">
        <div class="inline-flex">
            <p class="pr-4">{{ number + '. ' }}</p>
            <div class="flex flex-wrap items-center">
                <p class="text-justify mb-4"><b>{{ question }}</b></p>
                <ol class="text-small w-full">
                    <li v-for="(choice, index) in shuffleChoices" 
                        :key="index" 
                        class="flex items-center justify-between w-full px-2 py-1 my-2 cursor-pointer rounded-md border hover:bg-oceanBlue hover:text-white transition-all duration-300"
                        :class="{
                            'bg-green-200 text-green-800 hover:!bg-green-200': questionAnswer.isAnswered && choice === questionProps.trueAnswer,
                            'bg-red-200 text-red-800 hover:bg-red-200': questionAnswer.isAnswered && choice === questionAnswer.selectedChoice && choice !== questionProps.trueAnswer,
                            'cursor-not-allowed': questionAnswer.disableAnswer
                        }"
                        @click="markQuestion(choice)">

                        <span>{{ indexToAlpha(index) + ') ' + choice }}</span>

                        <!-- Correct Answer Indicator -->
                        <span v-if="questionAnswer.isAnswered && choice === questionProps.trueAnswer" class="text-green-500 font-bold">✓</span>

                        <!-- Incorrect Answer Indicator -->
                        <span v-if="questionAnswer.isAnswered && choice === questionAnswer.selectedChoice && choice !== questionProps.trueAnswer" class="text-red-500 font-bold">✗</span>
                    </li>
                </ol>
            </div>
        </div>
    </section>
</template>
