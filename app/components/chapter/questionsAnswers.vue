<script setup lang="ts">
import { reactive, ref, computed, watch } from "vue";
import { ANSWER_SEPARATOR, type Question } from "~/types/question.interface";


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

const questionProps = withDefaults(
  defineProps<Question & {
    isLastQuestion?: boolean;
    hasPreviousQuestion?: boolean;
    initialSelectedChoice?: string;
    revealFeedbackDuringAttempt?: boolean;
    advanceOnSubmit?: boolean;
    usedLanguage?: string;
  }>(),
  {
    isLastQuestion: false,
    hasPreviousQuestion: false,
    initialSelectedChoice: "",
    revealFeedbackDuringAttempt: true,
    advanceOnSubmit: false,
    usedLanguage: "English",
  },
);

const emit = defineEmits([
  "questionAnswered",
  "clickedChoice",
  "nextQuestion",
  "previousQuestion",
]);

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

const submitAndAdvanceMultipleChoice = () => {
  if (!questionAnswer.selectedChoice || questionAnswer.disableAnswer) return;

  submitMultipleChoice();

  if (!questionProps.isLastQuestion) {
    emit("nextQuestion");
  }
};

const indexToAlpha = (index: number) => String.fromCharCode(65 + index);

const shuffledChoices = ref<Question["choices"]>([]);

const setShuffledChoices = () => {
  const shuffled = [...questionProps.choices]
    .map((choice) => ({ choice, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ choice }) => choice);

  shuffledChoices.value = shuffled.filter(
    (item, index, self) =>
      self.findIndex((choice) => choice.value === item.value) === index,
  );
};


const dropZoneAnswers = ref<(string | null)[]>([]);
const submittedBlankStatuses = ref<boolean[]>([]);

const resetQuestionState = () => {
  questionPresentedAt.value = Date.now();
  questionAnswer.disableAnswer = false;
  questionAnswer.isAnswered = false;
  questionAnswer.selectedChoice = questionProps.initialSelectedChoice;
  questionAnswer.isCorrectAnswer = false;
  questionAnswer.clickedChoice = questionProps.initialSelectedChoice || null;
  isSubmitted.value = false;
  submittedBlankStatuses.value = [];

  const blanks =
    questionProps.blanks ||
    (questionProps.question.match(/(_\$blank)/g) || []).length;
  const initialAnswers = questionProps.initialSelectedChoice
    ? questionProps.initialSelectedChoice
        .split(ANSWER_SEPARATOR)
        .map((answer) => answer.trim())
        .filter(Boolean)
    : [];

  dropZoneAnswers.value = Array.from(
    { length: blanks as number },
    (_, index) => initialAnswers[index] ?? null,
  ) ?? [];
};

watch(
  () => [
    questionProps.question,
    questionProps.choices,
    questionProps.initialSelectedChoice,
  ],
  () => {
    setShuffledChoices();
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
    .split(ANSWER_SEPARATOR)
    .map((answer) => answer.trim());
  const currentAnswers = dropZoneAnswers.value.map((answer) => (answer ?? "").trim());
  const blankStatuses = currentAnswers.map(
    (answer, index) => answer === expectedAnswers[index]
  );
  const currentConcat = currentAnswers.join(ANSWER_SEPARATOR);
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

const submitAndAdvanceDragAnswer = () => {
  if (questionAnswer.disableAnswer || !canSubmitDragAnswer.value) return;

  submitDragAnswer();

  if (!questionProps.isLastQuestion) {
    emit("nextQuestion");
  }
};

const canSubmitDragAnswer = computed(() =>
  dropZoneAnswers.value.length > 0 &&
  dropZoneAnswers.value.every((answer) => answer !== null && answer !== "")
);

const goToNextQuestion = () => {
  emit("nextQuestion");
};

const goToPreviousQuestion = () => {
  emit("previousQuestion");
};

const toggleAnswerMode = () => {
  questionAnswer.isManualMode = !questionAnswer.isManualMode;
  resetQuestionState();
};

const blankClass = (index: number) => {
  return "border-oceanBlue bg-blue-50";
};

type OrderedQuestionSegment =
  | { type: "text"; text: string; key: string }
  | { type: "blank"; index: number; key: string };

type OrderedQuestionBlock =
  | { type: "paragraph"; segments: OrderedQuestionSegment[]; key: string }
  | {
      type: "ordered-item";
      marker: string;
      segments: OrderedQuestionSegment[];
      key: string;
    };

const orderedMarkerPattern =
  /(?<![A-Za-z0-9])(\(\s*(?:\d+|[A-Za-z]|[ivxlcdmIVXLCDM]+)\s*\)\.?\s*|(?:\d+|[A-Za-z]|[ivxlcdmIVXLCDM]+)[.)]\s+)/g;

const splitSegmentsWithBlanks = (
  text: string,
  blankStartIndex = 0,
) => {
  const parts = text.split(/(_\$blank)/);
  let blankIndex = blankStartIndex;
  const segments: OrderedQuestionSegment[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    if (part === "_$blank") {
      segments.push({
        type: "blank",
        index: blankIndex,
        key: `blank-${blankIndex}`,
      });
      blankIndex += 1;
      return;
    }

    segments.push({
      type: "text",
      text: part,
      key: `text-${blankIndex}-${index}`,
    });
  });

  return { segments, nextBlankIndex: blankIndex };
};

const orderedQuestionBlocks = computed<OrderedQuestionBlock[] | null>(() => {
  const rawQuestion = String(questionProps.question ?? "");
  const matches = Array.from(rawQuestion.matchAll(orderedMarkerPattern));

  if (matches.length < 2) return null;

  const blocks: OrderedQuestionBlock[] = [];
  let blankIndex = 0;

  matches.forEach((match, index) => {
    const markerStart = match.index ?? 0;
    const markerText = match[0];
    const contentStart = markerStart + markerText.length;
    const nextMarkerStart =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? rawQuestion.length)
        : rawQuestion.length;

    if (index === 0) {
      const introText = rawQuestion.slice(0, markerStart);
      if (introText.trim()) {
        const parsed = splitSegmentsWithBlanks(introText, blankIndex);
        blankIndex = parsed.nextBlankIndex;
        blocks.push({
          type: "paragraph",
          segments: parsed.segments,
          key: "paragraph-intro",
        });
      }
    }

    let itemText = rawQuestion.slice(contentStart, nextMarkerStart);
    const trailingBreakMatch = itemText.match(/^(.*?)(\n\s*\n+)$/s);
    let trailingText = "";

    if (trailingBreakMatch) {
      itemText = trailingBreakMatch[1];
      trailingText = trailingBreakMatch[2];
    }

    const parsed = splitSegmentsWithBlanks(itemText, blankIndex);
    blankIndex = parsed.nextBlankIndex;
    blocks.push({
      type: "ordered-item",
      marker: markerText.trim(),
      segments: parsed.segments,
      key: `ordered-item-${index}`,
    });

    if (index === matches.length - 1 && trailingText.trim()) {
      const parsedTrailing = splitSegmentsWithBlanks(trailingText, blankIndex);
      blankIndex = parsedTrailing.nextBlankIndex;
      blocks.push({
        type: "paragraph",
        segments: parsedTrailing.segments,
        key: "paragraph-outro",
      });
    }
  });

  return blocks;
});

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
  clone.innerText = questionProps.usedLanguage.toLowerCase().trim() === 'english' ? "example" : "mfano";

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
  if (!shuffledChoices.value.length) return;

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
    Math.random() * shuffledChoices.value.length
  );

  const sourceEl = choiceElements[randomChoiceIndex] as HTMLElement;
  const targetEl = dropZones[randomIndex] as HTMLElement;

  // animate
  flyToTarget(sourceEl, targetEl);

  // Set value after delay
  setTimeout(() => {
    dropZoneAnswers.value[randomIndex] = questionProps.usedLanguage.toLowerCase().trim() === 'english' ? 'example' : 'mfano';

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
      <p>{{ usedLanguage.toLowerCase().trim() === 'english' ? 'Choose the most correct answer.' : 'Chagua jibu sahihi zaidi.' }}</p>
      <button
        type="button"
        class="px-3 py-1 text-sm font-medium border rounded-md border-oceanBlue text-oceanBlue"
        @click="toggleAnswerMode()"
      >
        {{ usedLanguage.toLowerCase().trim() === 'english' ? questionAnswer.isManualMode ? "Switch to auto" : "Switch to manual" : questionAnswer.isManualMode ? "Badilisha hadi auto" : "Badilisha hadi mwenyewe" }}
      </button>
    </div>
    <div class="inline-flex">
      <p class="pr-4">{{ number + ". " }}</p>
      <div class="flex flex-wrap items-center w-full">
        <div
          v-if="orderedQuestionBlocks"
          class="w-full mb-4 space-y-3 text-justify"
        >
          <template v-for="block in orderedQuestionBlocks" :key="block.key">
            <p v-if="block.type === 'paragraph'" class="leading-relaxed">
              <template v-for="segment in block.segments" :key="segment.key">
                <span v-if="segment.type === 'text'">{{ segment.text }}</span>
                <span
                  v-else
                  class="inline-block min-w-[90px] border-b border-dashed border-slate-400 align-middle"
                >
                  &nbsp;
                </span>
              </template>
            </p>
            <div v-else class="flex items-start gap-3 leading-relaxed">
              <span class="shrink-0 font-medium">{{ block.marker }}</span>
              <div class="flex-1">
                <template v-for="segment in block.segments" :key="segment.key">
                  <span v-if="segment.type === 'text'">{{ segment.text }}</span>
                  <span
                    v-else
                    class="inline-block min-w-[90px] border-b border-dashed border-slate-400 align-middle"
                  >
                    &nbsp;
                  </span>
                </template>
              </div>
            </div>
          </template>
        </div>
        <p v-else class="mb-4 text-justify">
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
          <li v-for="(choice, index) in shuffledChoices" :key="choice._id || choice.value"
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
          v-if="questionProps.hasPreviousQuestion || questionAnswer.isManualMode"
          class="flex flex-wrap items-center gap-3 mt-4"
        >
          <button
            v-if="questionProps.hasPreviousQuestion"
            type="button"
            class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700"
            @click="goToPreviousQuestion()"
          >
            {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Previous question' :' Swali lililopita' }}
          </button>
          <button
            v-if="questionAnswer.isManualMode"
            type="button"
            class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700 disabled:opacity-50"
            :disabled="!questionAnswer.selectedChoice || questionAnswer.disableAnswer"
            @click="questionAnswer.selectedChoice = ''; questionAnswer.clickedChoice = null"
          >
           {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Undo choice' : 'Futa chaguo' }}
          </button>
          <button
            v-if="questionAnswer.isManualMode && !questionProps.advanceOnSubmit"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white rounded-md bg-oceanBlue disabled:opacity-50"
            :disabled="!questionAnswer.selectedChoice || questionAnswer.disableAnswer"
            @click="submitMultipleChoice()"
          >
            {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Submit answer' : 'Wasilisha jibu' }}
          </button>
          <button
            v-if="questionAnswer.isManualMode && questionProps.advanceOnSubmit"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white rounded-md bg-deepBlue disabled:opacity-50"
            :disabled="!questionAnswer.selectedChoice || questionAnswer.disableAnswer"
            @click="submitAndAdvanceMultipleChoice()"
          >
            {{ usedLanguage.toLowerCase().trim() === 'english' ?  questionProps.isLastQuestion ? "Finish quiz" : "Next question" : questionProps.isLastQuestion ? "Maliza zoezi" : "Swali lijalo" }}
          </button>
          <button
            v-if="questionAnswer.isManualMode && !questionProps.advanceOnSubmit && isSubmitted && !questionProps.isLastQuestion"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white rounded-md bg-deepBlue"
            @click="goToNextQuestion()"
          >
           {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Next question' : 'Swali lijalo' }}
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- drag and drop question and answer container -->
  <section v-else class="mt-6">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <p>{{ usedLanguage.toLowerCase().trim() === 'english' ? "Drag and drop the answers into the blanks." : "Jaza nafasi zilizoachwa wazi kwa kuburuta jibu sahihi" }}</p>
      <button
        type="button"
        class="px-3 py-1 text-sm font-medium border rounded-md border-oceanBlue text-oceanBlue"
        @click="toggleAnswerMode()"
      >
        {{ usedLanguage.toLowerCase().trim() === 'english' ?  questionAnswer.isManualMode ? "Switch to auto" : "Switch to manual" : questionAnswer.isManualMode ? "Badilisha hadi auto" : "Badilisha hadi mwenyewe" }}
      </button>
    </div>
    <div class="flex flex-col gap-4">
      <!-- Question Text with inline blanks -->
      <div class="flex justify-start">
        <p class="pr-4">{{ number + ". " }}</p>
        <div
          v-if="orderedQuestionBlocks"
          class="w-full space-y-3 text-justify"
        >
          <template v-for="block in orderedQuestionBlocks" :key="block.key">
            <p
              v-if="block.type === 'paragraph'"
              class="flex flex-wrap items-center justify-start gap-2 leading-relaxed"
            >
              <template v-for="segment in block.segments" :key="segment.key">
                <span v-if="segment.type === 'text'">{{ segment.text }}</span>
                <span
                  v-else
                  :class="[
                    'drag-zone inline-flex min-w-[100px] items-center justify-center gap-2 px-2 py-1 border-b border-dashed text-center text-sm rounded-sm transition-colors duration-300',
                    blankClass(segment.index),
                  ]"
                  @drop.prevent="handleDrop(segment.index, $event as any)"
                  @dragover.prevent
                >
                  {{ dropZoneAnswers[segment.index] || "____" }}
                  <button
                    v-if="dropZoneAnswers[segment.index] && !questionAnswer.disableAnswer"
                    type="button"
                    class="text-xs font-bold text-slate-500"
                    @click.stop="clearDropZone(segment.index)"
                  >
                    ×
                  </button>
                </span>
              </template>
            </p>
            <div v-else class="flex items-start gap-3 leading-relaxed">
              <span class="shrink-0 font-medium">{{ block.marker }}</span>
              <div class="flex flex-wrap items-center justify-start flex-1 gap-2">
                <template v-for="segment in block.segments" :key="segment.key">
                  <span v-if="segment.type === 'text'">{{ segment.text }}</span>
                  <span
                    v-else
                    :class="[
                      'drag-zone inline-flex min-w-[100px] items-center justify-center gap-2 px-2 py-1 border-b border-dashed text-center text-sm rounded-sm transition-colors duration-300',
                      blankClass(segment.index),
                    ]"
                    @drop.prevent="handleDrop(segment.index, $event as any)"
                    @dragover.prevent
                  >
                    {{ dropZoneAnswers[segment.index] || '____' }}
                    <button
                      v-if="dropZoneAnswers[segment.index] && !questionAnswer.disableAnswer"
                      type="button"
                      class="text-xs font-bold text-slate-500"
                      @click.stop="clearDropZone(segment.index)"
                    >
                      ×
                    </button>
                  </span>
                </template>
              </div>
            </div>
          </template>
        </div>
        <p v-else class="flex flex-wrap items-center justify-start gap-2 text-justify">
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
        <div v-for="(choice, index) in shuffledChoices" :key="choice._id || choice.value"
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
          v-if="questionProps.hasPreviousQuestion"
          type="button"
          class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700"
          @click="goToPreviousQuestion()"
        >
         {{usedLanguage.toLowerCase().trim() === 'english' ? ' Previous question' : 'Swali kabla'}}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700 disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !dropZoneAnswers.some(Boolean)"
          @click="undoLastDrop()"
        >
         {{usedLanguage.toLowerCase().trim() === 'english' ? ' Undo last' : 'Futa mwisho'}}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border rounded-md border-slate-300 text-slate-700 disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !dropZoneAnswers.some(Boolean)"
          @click="clearAllDrops()"
        >
          {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Clear all' : 'Futa zote' }}
        </button>
        <button
          v-if="questionAnswer.isManualMode && !questionProps.advanceOnSubmit"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white rounded-md bg-oceanBlue disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !canSubmitDragAnswer"
          @click="submitDragAnswer()"
        >
          {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Submit answer' : 'Wasilisha jibu' }}
        </button>
        <button
          v-if="questionAnswer.isManualMode && questionProps.advanceOnSubmit"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white rounded-md bg-deepBlue disabled:opacity-50"
          :disabled="questionAnswer.disableAnswer || !canSubmitDragAnswer"
          @click="submitAndAdvanceDragAnswer()"
        >
          {{ usedLanguage.toLowerCase().trim() === 'english' ? questionProps.isLastQuestion ? "Finish quiz" : "Next question" : questionProps.isLastQuestion ? "Maliza Zoezi" : "Swali linalofuata" }}
        </button>
        <button
          v-if="!questionProps.advanceOnSubmit && isSubmitted && !questionProps.isLastQuestion"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white rounded-md bg-deepBlue"
          @click="goToNextQuestion()"
        >
          {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Next question' : 'Swali linalofuata' }}
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
            {{ usedLanguage.toLowerCase().trim() === 'english' ? 'Drag each answer choice into the blank space. In manual mode, learners can undo, clear, submit, and then move with the next button.' : 'Jaza nafasi zilizoachwa wazi kwa kuburuta jibu sahihi. Katika modi ya mwenyewe, wanafunzi wanaweza kufuta, kufuta, kuwasilisha na kisha kuendelea kwa kitufe cha inayofuata.' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
