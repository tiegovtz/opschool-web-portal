<script setup>
import { reactive, ref, computed, nextTick, watch } from 'vue';

const questionAnswer = reactive({
  disableAnswer: false,
  isAnswered: false,
  selectedChoice: "",
  isCorrectAnswer: false,
  clickedChoice: null,
});

const questionProps = defineProps({
  questionType: String,
  question: String,
  trueAnswer: String,
  choices: Array,
  number: String,
  thumbnail: String,
  blanks: Number,
});

const emit = defineEmits(["questionAnswered", "clickedChoice"]);

const markQuestion = (choice) => {
  if (questionAnswer.disableAnswer) return;

  questionAnswer.selectedChoice = choice;
  questionAnswer.isAnswered = true;
  questionAnswer.isCorrectAnswer = choice === questionProps.trueAnswer;
  questionAnswer.disableAnswer = true;
  questionAnswer.clickedChoice = choice;

  emit("questionAnswered", questionAnswer.isCorrectAnswer);
  emit("clickedChoice", questionAnswer.clickedChoice);

  setTimeout(() => {
    questionAnswer.isAnswered = false;
    questionAnswer.selectedChoice = "";
    questionAnswer.isCorrectAnswer = false;
    questionAnswer.disableAnswer = false;
    questionAnswer.clickedChoice = null;
  }, 1000);
};

const indexToAlpha = (index) => String.fromCharCode(65 + index);

const shuffleChoices = computed(() => {
  return questionProps.choices
    .map((choice) => ({ choice, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ choice }) => choice);
});

const dropZoneAnswers = ref([]);
const isDropped = ref(false);

watch(
  () => questionProps.question,
  () => {
    const blanks = questionProps.blanks || (questionProps.question.match(/(_\$blank)/g) || []).length;
    dropZoneAnswers.value = Array.from({ length: blanks }, () => null);
  },
  { immediate: true }
);

const handleDrop = (index, event) => {
  if (dropZoneAnswers.value[index]) return;

  const data = event.dataTransfer.getData("text");
  dropZoneAnswers.value[index] = data;

  const filled = dropZoneAnswers.value.every(ans => ans !== null && ans !== '');
  const expected = questionProps.blanks || dropZoneAnswers.value.length;
  const currentConcat = dropZoneAnswers.value.filter(Boolean).join("-");

  if (filled && dropZoneAnswers.value.length === expected) {
    const isCorrect = currentConcat === questionProps.trueAnswer;
    emit("questionAnswered", isCorrect);
    emit("clickedChoice", currentConcat);
  }
};

const renderQuestionWithBlanks = computed(() => {
  const parts = questionProps.question.split(/(_\$blank)/);
  let blankIndex = 0;
  return parts.map((part) => {
    if (part === '_$blank') {
      const index = blankIndex++;
      return {
        isBlank: true,
        index,
        key: `blank-${index}`
      };
    } else {
      return {
        isBlank: false,
        text: part,
        key: `text-${Math.random().toString(36).substr(2, 9)}`
      };
    }
  });
});

const liveFilledSentence = computed(() => {
  return renderQuestionWithBlanks.value.map((part) =>
    part.isBlank
      ? dropZoneAnswers.value[part.index] || '____'
      : part.text
  ).join('');
});
</script>

<template>
  <section class="flex flex-col" v-if="questionType.toLowerCase() === 'multiple_choice'">
    <div class="inline-flex">
      <p class="pr-4">{{ number + ". " }}</p>
      <div class="flex flex-wrap items-center w-full">
        <p class="text-justify mb-4">
          <b>{{ question }}</b>
        </p>
        <p v-if="thumbnail" class="w-full h-auto overflow-hidden rounded-md my-2 max-h-[400px]">
          <NuxtImg :src="thumbnail" alt="thumbnail" class="object-cover w-full h-full" />
        </p>
        <ol class="text-small w-full">
          <li
            v-for="(choice, index) in shuffleChoices"
            :key="index"
            class="flex items-center justify-between w-full px-3 py-2 my-2 cursor-pointer rounded-md custom-box-shadow hover:bg-oceanBlue hover:text-white transition-all duration-500 ease-in-out"
            :class="{
              'bg-deepBlue hover:!bg-deepBlue text-white': questionAnswer.isAnswered && choice === questionAnswer.clickedChoice,
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

  <!-- drag and drop question and answer container -->
  <section v-else class="mt-6">
    <div class="flex flex-col gap-4">
      <!-- Question Text with inline blanks -->
      <div class="flex flex-wrap items-center">
        <p class="pr-4">{{ number + ". " }}</p>
        <p class="flex flex-wrap items-center gap-2 text-justify">
          <template v-for="(part, i) in renderQuestionWithBlanks">
            <span v-if="!part.isBlank" :key="part.key">{{ part.text }}</span>
            <span
              v-else
              :key="part.key + i"
              class="inline-block min-w-[100px] px-2 py-1 border-b border-dashed border-oceanBlue text-center text-sm bg-blue-50 rounded-sm"
              @drop.prevent="handleDrop(part.index, $event)"
              @dragover.prevent
            >
              {{ dropZoneAnswers[part.index] || '____' }}
            </span>
          </template>
        </p>
      </div>

      <!-- Choices to Drag -->
      <div class="flex gap-4 flex-wrap mt-4 pl-6">
        <div
          v-for="(choice, index) in shuffleChoices"
          :key="index"
          class="p-2 bg-oceanBlue bg-opacity-20 rounded-md cursor-move hover:bg-oceanBlue hover:text-white shadow transition-all duration-500 ease-in-out"
          draggable="true"
          @dragstart="(e) => e.dataTransfer.setData('text', choice)"
        >
          {{ choice }}
        </div>
      </div>
    </div>
  </section>
</template>

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
