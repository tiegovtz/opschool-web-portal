<script setup lang="ts">
import { reactive, ref, computed, watch } from "vue";
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
  isManualMode: true,
});
const questionPresentedAt = ref<number>(Date.now());
const isSubmitted = ref(false);

const questionProps = withDefaults(defineProps<Question & { isLastQuestion?: boolean }>(), {
  isLastQuestion: false,
});

const emit = defineEmits(["questionAnswered", "clickedChoice", "nextQuestion"]);

const buildAnswerPayload = (selectedChoice: string, isCorrect: boolean) => {
  const submittedAt = new Date().toISOString();
  const startedAt = new Date(questionPresentedAt.value).toISOString();
  const timeSpentSeconds = Math.max(
    0,
    Math.round((Date.now() - questionPresentedAt.value) / 1000),
  );

  return {
    isCorrect,
    selectedChoice,
    startedAt,
    submittedAt,
    timeSpentSeconds,
  };
};

const markQuestion = (choice: string) => {
  if (questionAnswer.disableAnswer) return;

  questionAnswer.selectedChoice = choice;
  questionAnswer.clickedChoice = choice;

  if (questionAnswer.isManualMode) {
    return;
  }

  submitMultipleChoice(choice);
};

const submitMultipleChoice = (choice = questionAnswer.selectedChoice) => {
  if (!choice || questionAnswer.disableAnswer) return;

  questionAnswer.isAnswered = true;
  questionAnswer.isCorrectAnswer = choice === questionProps.trueAnswer;
  questionAnswer.disableAnswer = true;
  isSubmitted.value = true;

  emit(
    "questionAnswered",
    buildAnswerPayload(choice, questionAnswer.isCorrectAnswer),
  );
  emit("clickedChoice", questionAnswer.clickedChoice);

  if (!questionAnswer.isManualMode && !questionProps.isLastQuestion) {
    setTimeout(() => {
      emit("nextQuestion");
    }, 800);
  }
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
const submittedBlankStatuses = ref<boolean[]>([]);

const resetQuestionState = () => {
  questionPresentedAt.value = Date.now();
  questionAnswer.disableAnswer = false;
  questionAnswer.isAnswered = false;
  questionAnswer.selectedChoice = "";
  questionAnswer.isCorrectAnswer = false;
  questionAnswer.clickedChoice = null;
  isSubmitted.value = false;
  submittedBlankStatuses.value = [];

  const blanks =
    questionProps.blanks ||
    (questionProps.question.match(/(_\$blank)/g) || []).length;
  dropZoneAnswers.value = Array.from({ length: blanks as number }, () => null) ?? [];
};

watch(
  () => questionProps.question,
  () => {
    resetQuestionState();
  },
  { immediate: true }
);

const handleDrop = (index: number, event: { dataTransfer: { getData: (arg0: string) => any; }; }) => {
  if (questionAnswer.disableAnswer) return;

  const data = event.dataTransfer.getData("text");
  if (!data) return;

  const existingIndex = dropZoneAnswers.value.findIndex((answer) => answer === data);
  if (existingIndex !== -1) {
    dropZoneAnswers.value[existingIndex] = null;
  }

  dropZoneAnswers.value[index] = data;

  const filled = dropZoneAnswers.value.every(
    (ans) => ans !== null && ans !== ""
  );

  if (filled && !questionAnswer.isManualMode) {
    submitDragAnswer();
  }
};

const clearDropZone = (index: number) => {
  if (questionAnswer.disableAnswer) return;
  dropZoneAnswers.value[index] = null;
};

const undoLastDrop = () => {
  if (questionAnswer.disableAnswer) return;

  const lastFilledIndex = [...dropZoneAnswers.value]
    .map((value, index) => ({ value, index }))
    .reverse()
    .find((entry) => entry.value)?.index;

  if (lastFilledIndex !== undefined) {
    dropZoneAnswers.value[lastFilledIndex] = null;
  }
};

const clearAllDrops = () => {
  if (questionAnswer.disableAnswer) return;
  dropZoneAnswers.value = dropZoneAnswers.value.map(() => null);
};

const submitDragAnswer = () => {
  if (questionAnswer.disableAnswer) return;

  const filled = dropZoneAnswers.value.every(
    (ans) => ans !== null && ans !== ""
  );

  if (!filled) return;

  const expectedAnswers = questionProps.trueAnswer
    .split("-")
    .map((answer) => answer.trim());
  const currentAnswers = dropZoneAnswers.value.map((answer) => (answer ?? "").trim());
  const blankStatuses = currentAnswers.map(
    (answer, index) => answer === expectedAnswers[index]
  );
  const currentConcat = currentAnswers.join("-");
  const isCorrect = blankStatuses.every(Boolean);

  submittedBlankStatuses.value = blankStatuses;
  questionAnswer.selectedChoice = currentConcat;
  questionAnswer.clickedChoice = currentConcat;
  questionAnswer.isAnswered = true;
  questionAnswer.isCorrectAnswer = isCorrect;
  questionAnswer.disableAnswer = true;
  isSubmitted.value = true;

  emit(
    "questionAnswered",
    {
      ...buildAnswerPayload(currentConcat, isCorrect),
      blankStatuses,
    },
  );
  emit("clickedChoice", currentConcat);

  if (!questionAnswer.isManualMode && !questionProps.isLastQuestion) {
    setTimeout(() => {
      emit("nextQuestion");
    }, 800);
  }
};

const canSubmitDragAnswer = computed(() =>
  dropZoneAnswers.value.length > 0 &&
  dropZoneAnswers.value.every((answer) => answer !== null && answer !== "")
);

const goToNextQuestion = () => {
  emit("nextQuestion");
};

const toggleAnswerMode = () => {
  questionAnswer.isManualMode = !questionAnswer.isManualMode;
  resetQuestionState();
};

const blankClass = (index: number) => {
  if (!isSubmitted.value) {
    return "border-oceanBlue bg-blue-50";
  }

  return submittedBlankStatuses.value[index]
    ? "border-green-500 bg-green-50 text-green-700"
    : "border-red-500 bg-red-50 text-red-700";
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

// playDemoAnimation and flyToTarget Function
const flyToTarget = (sourceEl: HTMLElement, targetEl: HTMLElement) => {
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
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <p>Choose the most correct answer.</p>
      <button
        type="button"
        class="px-3 py-1 text-sm font-medium border rounded-md border-oceanBlue text-oceanBlue"
        @click="toggleAnswerMode()"
      >
        {{ questionAnswer.isManualMode ? "Switch to auto" : "Switch to manual" }}
      </button>
    </div>
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
                (questionAnswer.isAnswered || questionAnswer.isManualMode) &&
                choice.value === questionAnswer.clickedChoice,
              'cursor-not-allowed': questionAnswer.disableAnswer,
            }" @click="markQuestion(choice.value)">
            <span>{{ indexToAlpha(index) + ") " + choice.value }}</span>
          </li>
        </ol>
        <div
          v-if="questionAnswer.isManualMode"
          class="flex flex-wrap items-center gap-3 mt-4"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700 disabled:opacity-50"
            :disabled="!questionAnswer.selectedChoice || questionAnswer.disableAnswer"
            @click="questionAnswer.selectedChoice = ''; questionAnswer.clickedChoice = null"
          >
            Undo choice
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white rounded-md bg-oceanBlue disabled:opacity-50"
            :disabled="!questionAnswer.selectedChoice || questionAnswer.disableAnswer"
            @click="submitMultipleChoice()"
          >
            Submit answer
          </button>
          <button
            v-if="isSubmitted && !questionProps.isLastQuestion"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white rounded-md bg-deepBlue"
            @click="goToNextQuestion()"
          >
            Next question
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- drag and drop question and answer container -->
  <section v-else class="mt-6">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <p>Drag and drop the answers into the blanks.</p>
      <button
        type="button"
        class="px-3 py-1 text-sm font-medium border rounded-md border-oceanBlue text-oceanBlue"
        @click="toggleAnswerMode()"
      >
        {{ questionAnswer.isManualMode ? "Switch to auto" : "Switch to manual" }}
      </button>
    </div>
    <div class="flex flex-col gap-4">
      <!-- Question Text with inline blanks -->
      <div class="flex justify-start">
        <p class="pr-4">{{ number + ". " }}</p>
        <p class="flex flex-wrap items-center justify-start gap-2 text-justify">
          <template v-for="(part, i) in renderQuestionWithBlanks">
            <span v-if="!part.isBlank" :key="part.key">{{ part.text }}</span>
            <span v-else :key="part.key + i"
              :class="[
                'drag-zone inline-flex min-w-[100px] items-center justify-center gap-2 px-2 py-1 border-b border-dashed text-center text-sm rounded-sm transition-colors duration-300',
                blankClass(part.index as number),
              ]"
              @drop.prevent="handleDrop(part.index as number, $event as any)" @dragover.prevent>
              {{ dropZoneAnswers[part.index as number] || "____" }}
              <button
                v-if="dropZoneAnswers[part.index as number] && !questionAnswer.disableAnswer"
                type="button"
                class="text-xs font-bold text-slate-500"
                @click.stop="clearDropZone(part.index as number)"
              >
                ×
              </button>
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
          :class="{
            'opacity-40 cursor-not-allowed': questionAnswer.disableAnswer,
          }"
          draggable="true" @dragstart="(e) => (e as DragEvent).dataTransfer?.setData('text', choice.value)">
          {{ choice.value }}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 pl-6">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700 disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !dropZoneAnswers.some(Boolean)"
          @click="undoLastDrop()"
        >
          Undo last
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700 disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !dropZoneAnswers.some(Boolean)"
          @click="clearAllDrops()"
        >
          Clear all
        </button>
        <button
          v-if="questionAnswer.isManualMode"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white rounded-md bg-oceanBlue disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !canSubmitDragAnswer"
          @click="submitDragAnswer()"
        >
          Submit answer
        </button>
        <button
          v-if="isSubmitted && !questionProps.isLastQuestion"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white rounded-md bg-deepBlue"
          @click="goToNextQuestion()"
        >
          Next question
        </button>
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
            Drag each answer choice into the blank space. In manual mode, learners can undo, clear, submit, and then move with the next button.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
