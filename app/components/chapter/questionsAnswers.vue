<script setup lang="ts">
import { reactive, ref, computed, nextTick, watch } from "vue";
import type { Question } from "~/types/question.interface";

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
  clickedChoice: "" as string | null,
});

const questionProps = defineProps<Question>();

const emit = defineEmits(["questionAnswered", "clickedChoice"]);

const markQuestion = (choice: string) => {
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

const indexToAlpha = (index: number) => String.fromCharCode(65 + index);

const shuffleChoices = computed(() => {
  const shuffled = questionProps.choices
    .map((choice) => ({ choice, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ choice }) => choice);

  // Remove duplicates
  return shuffled.filter((item, index, self) => self.indexOf(item) === index);
});


const dropZoneAnswers = ref<(string | null)[]>([]);
const isDropped = ref(false);

watch(
  () => questionProps.question,
  () => {
    const blanks =
      questionProps.blanks ||
      (questionProps.question.match(/(_\$blank)/g) || []).length;
    dropZoneAnswers.value = Array.from({ length: blanks as number }, () => null) ?? [];
  },
  { immediate: true }
);

const handleDrop = (index: number, event: { dataTransfer: { getData: (arg0: string) => any; }; }) => {
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
      part.isBlank ? dropZoneAnswers.value[part.index as number] || "____" : part.text
    )
    .join("");
});

// playDemoAnimation and flyToTarget Function
const flyToTarget = (sourceEl: HTMLElement, targetEl: HTMLElement, index?: number) => {
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.innerText = "example";

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  // Setup styles
  Object.assign(clone.style, {
    position: 'fixed',
    top: `${sourceRect.top}px`,
    left: `${sourceRect.left}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    backgroundColor: '#0077c5',
    color: '#fff',
    zIndex: 9999,
    transition: 'all 1s ease-in-out',
    pointerEvents: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });

  document.body.appendChild(clone);

  // Force reflow (ensure styles are applied before animation)
  clone.getBoundingClientRect(); // ⬅️ Triggers layout

  // Trigger animation
  requestAnimationFrame(() => {
    clone.style.top = `${targetRect.top}px`;
    clone.style.left = `${targetRect.left}px`;
    clone.style.width = `${targetRect.width}px`;
    clone.style.height = `${targetRect.height}px`;
  });

  // Cleanup after animation
  setTimeout(() => {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
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
    availableIndexes[Math.floor(Math.random() * availableIndexes.length)] as number;
  const randomChoiceIndex = Math.floor(
    Math.random() * shuffleChoices.value.length
  );

  const sourceEl = choiceElements[randomChoiceIndex] as HTMLElement;
  const targetEl = dropZones[randomIndex] as HTMLElement;

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

  <section class="flex flex-col" v-if="questionType.toLowerCase() === 'multiple_choice'">
    <p>Choose the most correct answer.</p>
    <div class="inline-flex">
      <p class="pr-4">{{ number + ". " }}</p>
      <div class="flex flex-wrap items-center w-full">
        <p class="mb-4 text-justify">
          {{ question }}
        </p>
        <!-- <p
          v-if="thumbnail"
          class="w-full h-auto overflow-hidden rounded-md my-2 max-h-[400px]"
        >
          <NuxtImg
            :src="thumbnail"
            alt="thumbnail"
            class="object-cover w-full h-full"
          />
        </p> -->
        <ol class="w-full text-small">
          <li v-for="(choice, index) in shuffleChoices" :key="index"
            class="flex items-center justify-between w-full px-3 py-2 my-2 transition-all duration-500 ease-in-out rounded-md cursor-pointer custom-box-shadow hover:bg-oceanBlue hover:text-white"
            :class="{
              'bg-deepBlue hover:!bg-deepBlue text-white':
                questionAnswer.isAnswered &&
                choice.value === questionAnswer.clickedChoice,
              'cursor-not-allowed': questionAnswer.disableAnswer,
            }" @click="markQuestion(choice.value)">
            <span>{{ indexToAlpha(index) + ") " + choice.value }}</span>
          </li>
        </ol>
      </div>
    </div>
  </section>

  <!-- drag and drop question and answer container -->
  <section v-else class="mt-6">
    <p>Drag and Drop respective answers in blank provided.</p>
    <div class="flex flex-col gap-4">
      <!-- Question Text with inline blanks -->
      <div class="flex justify-start">
        <p class="pr-4">{{ number + ". " }}</p>
        <p class="flex flex-wrap items-center justify-start gap-2 text-justify">
          <template v-for="(part, i) in renderQuestionWithBlanks">
            <span v-if="!part.isBlank" :key="part.key">{{ part.text }}</span>
            <span v-else :key="part.key + i"
              class="drag-zone inline-block min-w-[100px] px-2 py-1 border-b border-dashed border-oceanBlue text-center text-sm bg-blue-50 rounded-sm"
              @drop.prevent="handleDrop(part.index as number, $event as any)" @dragover.prevent>
              {{ dropZoneAnswers[part.index as number] || "____" }}
            </span>
          </template>
        </p>
      </div>
      <!-- <p
        v-if="thumbnail"
        class="w-full h-auto overflow-hidden rounded-md my-2 max-h-[400px]"
      >
        <NuxtImg
          :src="thumbnail"
          alt="thumbnail"
          class="object-contain w-full h-full"
        />
      </p> -->
      <!-- Choices to Drag -->
      <div class="flex flex-wrap gap-4 pl-6 mt-4">
        <div v-for="(choice, index) in shuffleChoices" :key="index"
          class="p-2 transition-all duration-500 ease-in-out rounded-md shadow cursor-move bg-oceanBlue bg-opacity-20 hover:bg-oceanBlue hover:text-white drag-answers"
          draggable="true" @dragstart="(e) => (e as DragEvent).dataTransfer?.setData('text', choice.value)">
          {{ choice.value }}
        </div>
      </div>
      <!-- tips or Help information -->
      <div class="flex items-center gap-4 mt-4">
        <div @click="isTipsOpen()"
          class="flex items-center justify-center p-2 bg-white rounded-full cursor-pointer custom-box-shadow-1">
          <Icon name="tabler:question-mark" size="20" />
        </div>
        <div class="flex items-center">
          <p :class="[
            'max-w-2xl text-oceanBlue text-sm transition-all duration-500 ease-in-out',
          ]">
            Drag each answer choice into the blank space by clicking and
            dragging with your mouse on desktop, or by tapping, holding, and
            sliding with your finger on mobile.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
