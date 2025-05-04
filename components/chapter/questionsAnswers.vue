<script setup>
import { reactive, ref, computed, nextTick, watch } from "vue";

// Define State
const isTips = ref(false);

// Define Function
const isTipsOpen = () => {
  isTips.value = !isTips.value;

  if (isTips.value) {
    playDemoAnimation();
  }
};

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
    const blanks =
      questionProps.blanks ||
      (questionProps.question.match(/(_\$blank)/g) || []).length;
    dropZoneAnswers.value = Array.from({ length: blanks }, () => null);
  },
  { immediate: true }
);

const handleDrop = (index, event) => {
  if (dropZoneAnswers.value[index]) return;

  const data = event.dataTransfer.getData("text");
  dropZoneAnswers.value[index] = data;

  const filled = dropZoneAnswers.value.every(
    (ans) => ans !== null && ans !== ""
  );
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
    if (part === "_$blank") {
      const index = blankIndex++;
      return {
        isBlank: true,
        index,
        key: `blank-${index}`,
      };
    } else {
      return {
        isBlank: false,
        text: part,
        key: `text-${Math.random().toString(36).substring(2, 9)}`,
      };
    }
  });
});

const liveFilledSentence = computed(() => {
  return renderQuestionWithBlanks.value
    .map((part) =>
      part.isBlank ? dropZoneAnswers.value[part.index] || "____" : part.text
    )
    .join("");
});

// playDemoAnimation and flyToTarget Function
const flyToTarget = (sourceEl, targetEl, index) => {
  const clone = sourceEl.cloneNode(true);
  clone.innerText = "example";
 
  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  clone.style.position = "fixed";
  clone.style.zIndex = "9999";
  clone.style.top = sourceRect.top + "px";
  clone.style.left = sourceRect.left + "px";
  clone.style.width = sourceRect.width + "px";
  clone.style.transition = "all 1s ease-in-out";

  document.body.appendChild(clone);

  // Trigger animation
  requestAnimationFrame(() => {
    clone.style.top = targetRect.top + "px";
    clone.style.left = targetRect.left + "px";
    clone.style.opacity = 1;
  });

  // After animation completes
  setTimeout(() => {
    document.body.removeChild(clone);
  }, 1000);
};

const playDemoAnimation = async () => {
  if (!shuffleChoices.value.length) return;
  let i = 0;

  // drag-zone and drag-answers class
  const choiceElements = document.querySelectorAll(".drag-answers");
  const dropZones = document.querySelectorAll(".drag-zone");

  // Animate the movement for number of blanks
  const availableIndexes = Array.from(
    { length: dropZones.length },
    (_, i) => i
  );
  const randomIndex =
    availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
  const randomChoiceIndex = Math.floor(
    Math.random() * shuffleChoices.value.length
  );

  const sourceEl = choiceElements[randomChoiceIndex];
  const targetEl = dropZones[randomIndex];

  // animate
  flyToTarget(sourceEl, targetEl);

  // Set value after delay
  setTimeout(() => {
    dropZoneAnswers.value[randomIndex] = 'example';

    // Clean up after 2 sec
    setTimeout(() => {
      dropZoneAnswers.value[randomIndex] = null;
      isTips.value = !isTips.value;
    }, 3000);
  }, 1000);
};
</script>

<template>
  <section
    class="flex flex-col"
    v-if="questionType.toLowerCase() === 'multiple_choice'"
  >
    <div class="inline-flex">
      <p class="pr-4">{{ number + ". " }}</p>
      <div class="flex flex-wrap items-center w-full">
        <p class="mb-4 text-justify">
          <b>{{ question }}</b>
        </p>
        <p
          v-if="thumbnail"
          class="w-full h-auto overflow-hidden rounded-md my-2 max-h-[400px]"
        >
          <NuxtImg
            :src="thumbnail"
            alt="thumbnail"
            class="object-cover w-full h-full"
          />
        </p>
        <ol class="w-full text-small">
          <li
            v-for="(choice, index) in shuffleChoices"
            :key="index"
            class="flex items-center justify-between w-full px-3 py-2 my-2 transition-all duration-500 ease-in-out rounded-md cursor-pointer custom-box-shadow hover:bg-oceanBlue hover:text-white"
            :class="{
              'bg-deepBlue hover:!bg-deepBlue text-white':
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

  <!-- drag and drop question and answer container -->
  <section v-else class="mt-6">
    <div class="flex flex-col gap-4">
      <!-- Question Text with inline blanks -->
      <div class="flex justify-start">
        <p class="pr-4">{{ number + ". " }}</p>
        <p class="flex flex-wrap items-center justify-start gap-2 text-justify">
          <template v-for="(part, i) in renderQuestionWithBlanks">
            <span v-if="!part.isBlank" :key="part.key">{{ part.text }}</span>
            <span
              v-else
              :key="part.key + i"
              class="drag-zone inline-block min-w-[100px] px-2 py-1 border-b border-dashed border-oceanBlue text-center text-sm bg-blue-50 rounded-sm font-bold"
              @drop.prevent="handleDrop(part.index, $event)"
              @dragover.prevent
            >
              {{ dropZoneAnswers[part.index] || "____" }}
            </span>
          </template>
        </p>

        <p v-if="thumbnail" class="w-full h-auto overflow-hidden rounded-md my-2 max-h-[400px]">
          <NuxtImg :src="thumbnail" alt="thumbnail" class="object-cover w-full h-full" />
        </p>
      </div>
      <p
        v-if="thumbnail"
        class="w-full h-auto overflow-hidden rounded-md my-2 max-h-[400px]"
      >
        <NuxtImg
          :src="thumbnail"
          alt="thumbnail"
          class="object-contain w-full h-full"
        />
      </p>
      <!-- Choices to Drag -->
      <div class="flex flex-wrap gap-4 pl-6 mt-4">
        <div
          v-for="(choice, index) in shuffleChoices"
          :key="index"
          class="p-2 transition-all duration-500 ease-in-out rounded-md shadow cursor-move bg-oceanBlue bg-opacity-20 hover:bg-oceanBlue hover:text-white drag-answers"
          draggable="true"
          @dragstart="(e) => e.dataTransfer.setData('text', choice)"
        >
          {{ choice }}
        </div>
      </div>
      <!-- tips or Help information -->
      <div class="flex items-center gap-4 mt-4">
        <div
          @click="isTipsOpen()"
          class="flex items-center justify-center p-2 bg-white rounded-full cursor-pointer custom-box-shadow-1"
        >
          <Icon name="tabler:question-mark" size="20" />
        </div>
        <div class="flex items-center">
          <p
            :class="[
              'max-w-2xl text-textGray transition-all duration-500 ease-in-out',
            ]"
          >
            Drag each answer choice into the blank space by clicking and
            dragging with your mouse on desktop, or by tapping, holding, and
            sliding with your finger on mobile.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
