<script setup>
import { ref } from "vue";

const questionProps = defineProps({
    questionType: String,
    question: String,
    trueAnswer: String,
    choices: Array,
    number: String,
});

const answeredChoices = ref({}); // Stores answers for each choice

// Function to check if a selected choice is correct
const isCorrectAnswer = (index, choice) => {
    answeredChoices.value[index] = choice === questionProps.trueAnswer ? 'correct' : 'incorrect';
};

// Function to convert index to alphabetic character (0 -> A, 1 -> B, etc.)
const indexToAlpha = (index) => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
};
</script>

<template>
    <section class="flex flex-col">
        <div class="inline-flex">
            <p class="pr-4">{{ number + '. ' }}</p>
            <div class="flex flex-wrap items-center">
                <p>{{ question }}</p>
                <ol class="inline-flex flex-wrap items-center text-small my-2">
                    <li v-for="(choice, index) in choices" 
                        :key="index" 
                        class="px-2 cursor-pointer flex items-center space-x-2"
                        @click="isCorrectAnswer(index, choice)">
                        
                        <span>{{ indexToAlpha(index) + ') ' + choice }}</span>

                        <!-- Show checkmark for correct answer -->
                        <span v-if="answeredChoices[index] === 'correct'" class="text-green-500 font-bold">✓</span>

                        <!-- Show "X" for incorrect answer -->
                        <span v-else-if="answeredChoices[index] === 'incorrect'" class="text-red-500 font-bold">✗</span>
                    </li>
                </ol>
            </div>
        </div>
    </section>
</template>
