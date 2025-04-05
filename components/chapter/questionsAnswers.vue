<script setup>
// define states
const questionAnswer = reactive({
  disableAnswer: false, // Prevents multiple answers
  isAnswered: false, // Indicates if an answer was chosen
  selectedChoice: "", // Stores the selected choice
  isCorrectAnswer: false, // True if the chosen answer is correct,
  clickedChoice: null,
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
const emit = defineEmits(["questionAnswered", "clickedChoice"]);

// Function to check if a selected choice is correct
const markQuestion = (choice) => {
  if (questionAnswer.disableAnswer) return; // Prevent multiple selections

  questionAnswer.selectedChoice = choice;
  questionAnswer.isAnswered = true;
  questionAnswer.isCorrectAnswer = choice === questionProps.trueAnswer;
  questionAnswer.disableAnswer = true; // Disable further clicks
  questionAnswer.clickedChoice = choice;

  emit("questionAnswered", questionAnswer.isCorrectAnswer);
  emit("clickedChoice", questionAnswer.clickedChoice);

  // Reset after 2 seconds
  setTimeout(() => {
    questionAnswer.isAnswered = false;
    questionAnswer.selectedChoice = "";
    questionAnswer.isCorrectAnswer = false;
    questionAnswer.disableAnswer = false;
    questionAnswer.clickedChoice = null;
  }, 1000);
};

// Function to convert index to alphabetic character (0 -> A, 1 -> B, etc.)
const indexToAlpha = (index) => {
  return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
};

// Shuffle choices
const shuffleChoices = computed(() => {
  return questionProps.choices
    .map((choice) => ({ choice, sort: Math.random() })) // Assign a random sort key
    .sort((a, b) => a.sort - b.sort) // Sort by random key
    .map(({ choice }) => choice); // Extract shuffled choices
});
</script>

<template>
  <section class="flex flex-col">
    <div class="inline-flex">
      <p class="pr-4">{{ number + ". " }}</p>
      <div class="flex flex-wrap items-center w-full">
        <p class="text-justify mb-4">
          <b>{{ question }}</b>
        </p>

        <!-- <ol class="text-small w-full">
                    <li v-for="(choice, index) in shuffleChoices" :key="index"
                        class="flex items-center justify-between w-full px-3 py-2 my-2 cursor-pointer rounded-md custom-box-shadow hover:bg-oceanBlue hover:text-white transition-all duration-500 ease-in-out"
                        :class="{
                            'bg-green-500 border border-green-500 text-white hover:!bg-green-500': questionAnswer.isAnswered && choice === questionProps.trueAnswer,
                            'bg-red-500 border border-red-500 text-white hover:bg-red-500': questionAnswer.isAnswered && choice === questionAnswer.selectedChoice && choice !== questionProps.trueAnswer,
                            'cursor-not-allowed': questionAnswer.disableAnswer
                        }" @click="markQuestion(choice)">

                        <span>{{ indexToAlpha(index) + ') ' + choice }}</span>
                        <span v-if="questionAnswer.isAnswered && choice === questionProps.trueAnswer"
                            class="text-green-500 font-bold">✓</span>
                        <span
                            v-if="questionAnswer.isAnswered && choice === questionAnswer.selectedChoice && choice !== questionProps.trueAnswer"
                            class="text-red-500 font-bold">✗</span>
                    </li>
                </ol> -->

        <ol class="text-small w-full">
          <li
            v-for="(choice, index) in shuffleChoices"
            :key="index"
            class="flex items-center justify-between w-full px-3 py-2 my-2 cursor-pointer rounded-md custom-box-shadow hover:bg-oceanBlue hover:text-white transition-all duration-500 ease-in-out"
            :class="{
              'bg-deepBlue hover:!bg-deepBlue text-white ':
                questionAnswer.isAnswered &&
                choice === questionAnswer.clickedChoice,

              'cursor-not-allowed': questionAnswer.disableAnswer,
            }"
            @click="markQuestion(choice)"
          >
            <span>{{ indexToAlpha(index) + ") " + choice }}</span>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
