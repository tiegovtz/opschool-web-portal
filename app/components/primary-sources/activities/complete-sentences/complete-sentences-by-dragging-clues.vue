<script setup lang="tsx">
import { ref, computed, unref } from "vue";
import { Icon } from "@iconify/vue";

// Local imports
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, { ActivityResultsAlertDialog } from "@/components/templates/results";
import { shuffle } from "~/utilities/utils";
import DNDContext from "~/components/layout/dnd-context";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";
import { ActivityType } from "~/types/activity-types";

// Props
type QuestionItem = {
  question: string;
  image?: string;
  answer: string;
};

type OptionItem = {
  value: string;
  image?: string;
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    algorithm?: string;
    questions: QuestionItem[];
    options: OptionItem[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();

/** Optional CMS title override (`Title||18`); otherwise use responsive classes only. */
const activityFontStyle = computed(() => {
  const raw = props.questions.fontSize;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return { fontSize: `${n}px` };
});

// State
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const answers = ref<Record<number, { value: string; optionId: string; image?: string }>>({});
const activityInstructionsId = "complete-sentences-dragging-clues-instructions";
const activityStatusId = "complete-sentences-dragging-clues-status";
const selectedOptionId = ref<string | null>(null);
const keyboardStatusMessage = ref("");

// Shuffle options
type UniqueOption = { id: string; value: string; image?: string; uniqueIndex: number };
const initialOptions = props.questions.options.map((opt, idx) => ({
  id: `option-${idx}`,
  value: opt.value,
  image: opt.image,
  uniqueIndex: idx,
}));

const shuffledOptions = ref<UniqueOption[]>(shuffle([...initialOptions]));

const questionParts = (question: string) => String(question ?? "").split("___");

const normalizeMarkingValue = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getMarkingAnswers = (answer: unknown) => {
  const normalized = normalizeMarkingValue(answer);
  if (!normalized) return [];

  const alternatives = normalized
    .split(/\s*(?:\/|,|;|\|)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return alternatives.length > 1 ? alternatives : [normalized];
};

const isCorrectAnswer = (selected: unknown, expected: unknown) => {
  const selectedAnswer = normalizeMarkingValue(selected);
  return selectedAnswer !== "" && getMarkingAnswers(expected).includes(selectedAnswer);
};

const calculateScore = (nextAnswers: Record<number, { value: string; optionId: string; image?: string }>) =>
  props.questions.questions.reduce(
    (acc, question, idx) => acc + (isCorrectAnswer(nextAnswers[idx]?.value, question.answer) ? 1 : 0),
    0,
  );

function handleDragEnd({ active, over }: any) {
  if (!over) return;

  const activeIdParts = active.id.split("%");
  const dropQuestionIndex = parseInt(over.id.split("%")[0]);

  let activeOptionUniqueId: string;
  let activeOptionValue: string;
  let activeOptionImage: string | undefined;

  // Dragging from answered question
  if (activeIdParts.length === 3) {
    const sourceQuestionIndex = parseInt(activeIdParts[0]);
    const sourceAnswer = answers.value[sourceQuestionIndex];
    if (sourceAnswer) {
      activeOptionUniqueId = sourceAnswer.optionId;
      activeOptionValue = sourceAnswer.value;
      activeOptionImage = sourceAnswer.image;
    } else {
      activeOptionUniqueId = activeIdParts[1];
      activeOptionValue = activeIdParts[2];
    }
  } else {
    activeOptionUniqueId = activeIdParts[0];
    const option = shuffledOptions.value.find((opt) => opt.id === activeOptionUniqueId);
    activeOptionValue = option?.value ?? activeIdParts.slice(1).join("%");
    activeOptionImage = option?.image;
  }

  const newAnswers = { ...answers.value };

  // Remove from source if dragging from question
  if (activeIdParts.length === 3) {
    const sourceQuestionIndex = parseInt(activeIdParts[0]);
    if (sourceQuestionIndex !== dropQuestionIndex) {
      delete newAnswers[sourceQuestionIndex];
    }
  }

  // Remove previous answer in target
  if (newAnswers[dropQuestionIndex]) delete newAnswers[dropQuestionIndex];

  // Remove option used elsewhere
  const previousQuestionIndex = Object.entries(newAnswers).find(
    ([, ans]) => ans.optionId === activeOptionUniqueId
  )?.[0];
  if (previousQuestionIndex) delete newAnswers[parseInt(previousQuestionIndex)];

  // Assign to new question
  newAnswers[dropQuestionIndex] = {
    value: activeOptionValue,
    optionId: activeOptionUniqueId,
    image: activeOptionImage,
  };
  answers.value = newAnswers;
  keyboardStatusMessage.value = ui.formatActivityPlaced(
    ui.formatQuestion(dropQuestionIndex + 1),
    activeOptionValue,
  );

  const isComplete = Object.keys(newAnswers).length === props.questions.questions.length;

  // Calculate the score before opening the results dialog.
  if (isComplete) {
    score.value = calculateScore(newAnswers);
    keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${props.questions.questions.length}.`;
  }

  allAnswered.value = isComplete;
  selectedOptionId.value = null;
}

// Available options
const getAvailableOptions = computed(() =>
  shuffledOptions.value.filter(
    (opt) => !Object.values(answers.value).some((a) => a.optionId === opt.id)
  )
);

// Reset activity
function handleTryAgain() {
  allAnswered.value = false;
  showResults.value = false;
  score.value = 0;
  answers.value = {};
  shuffledOptions.value = shuffle([...initialOptions]);
  selectedOptionId.value = null;
  keyboardStatusMessage.value = "";
}

const selectedOption = computed(() =>
  getAvailableOptions.value.find((option) => option.id === selectedOptionId.value) || null,
);

/** Short, stable chip text; full clue wording is only in aria-label (avoids huge labels in the blank). */
const blankDropZoneLabel = computed(() => {
  if (selectedOption.value) {
    return unref(ui.isSwahili) ? "Bonyeza kuweka" : "Tap to place";
  }
  return unref(ui.isSwahili) ? "Weka jibu hapa" : "Blank";
});

function placeSelectedOption(questionIndex: number) {
  if (showResults.value) return;
  if (!selectedOption.value) {
    keyboardStatusMessage.value = ui.isSwahili.value
      ? "Chagua chaguo kwanza kabla ya kuweka kwenye pengo."
      : "Select an option first before placing it in a blank.";
    return;
  }

  const nextAnswers = { ...answers.value };
  const previousQuestionIndex = Object.entries(nextAnswers).find(
    ([, answer]) => answer.optionId === selectedOption.value?.id,
  )?.[0];

  if (previousQuestionIndex) {
    delete nextAnswers[Number(previousQuestionIndex)];
  }

  nextAnswers[questionIndex] = {
    value: selectedOption.value.value,
    optionId: selectedOption.value.id,
    image: selectedOption.value.image,
  };

  answers.value = nextAnswers;
  const isComplete = Object.keys(nextAnswers).length === props.questions.questions.length;
  keyboardStatusMessage.value = ui.formatActivityPlaced(
    ui.formatQuestion(questionIndex + 1),
    selectedOption.value.value,
  );

  // Calculate the score before opening the results dialog.
  if (isComplete) {
    score.value = calculateScore(nextAnswers);
    keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${props.questions.questions.length}.`;
  }

  allAnswered.value = isComplete;
  selectedOptionId.value = null;
}

function removeAnswer(questionIndex: number) {
  if (showResults.value || !answers.value[questionIndex]) return;

  const removedAnswer = answers.value[questionIndex];
  const nextAnswers = { ...answers.value };
  delete nextAnswers[questionIndex];
  answers.value = nextAnswers;
  allAnswered.value = false;
  keyboardStatusMessage.value = ui.formatActivityRemoved(
    ui.formatQuestion(questionIndex + 1),
    removedAnswer.value,
  );
}

function ariaBlankDrop(questionIndex: number, blankIndex: number) {
  const sel = selectedOption.value;
  if (unref(ui.isSwahili)) {
    return sel
      ? `Nafasi ${blankIndex + 1} kwa swali ${questionIndex + 1}. Bonyeza kuweka: ${sel.value}`
      : `Nafasi ${blankIndex + 1} kwa swali ${questionIndex + 1}. Chagua kidokezo kwanza.`;
  }
  return sel
    ? `Blank ${blankIndex + 1} for question ${questionIndex + 1}. Activate to place ${sel.value}.`
    : `Blank ${blankIndex + 1} for question ${questionIndex + 1}. Select a clue first.`;
}
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-dragging-clues-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-dragging-clues-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Buruta kila kidokezo hadi kwenye nafasi inayolingana, au tumia Tab kuchagua kidokezo kisha bonyeza nafasi husika kukiweka. Bonyeza jibu lililowekwa kuliondoa."
        : "Drag each clue into the matching blank, or use Tab to select a clue and then activate the matching blank to place it. Activate a placed answer to remove it." }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <div
      class="flex h-full flex-col gap-2 bg-picton-blue-100 px-1.5 py-2 text-base leading-normal sm:gap-2.5 sm:px-0 sm:py-2 sm:text-lg md:text-xl md:leading-relaxed"
      :style="activityFontStyle"
    >
      <DNDContext :onDragEnd="handleDragEnd">
        <!-- Options pool -->
        <div class="mb-2 flex shrink-0 flex-wrap gap-2 sm:mb-3 sm:gap-2.5 md:gap-3">
          <Draggable
            v-for="option in getAvailableOptions"
            :key="option.id"
            :id="option.id"
            :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
            :aria-pressed="selectedOptionId === option.id"
            role="button"
            tabindex="0"
            :class="[
              'flex min-h-[3rem] max-w-[min(100%,12.5rem)] items-center justify-center rounded border border-picton-blue-400 bg-picton-blue-200 px-2.5 py-2 text-left text-sm leading-snug break-words sm:min-h-[3.25rem] sm:max-w-[14rem] sm:text-base md:max-w-[17rem] md:text-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2',
              selectedOptionId === option.id ? 'ring-2 ring-picton-blue-500 ring-offset-2' : '',
            ]"
            @click="selectedOptionId = selectedOptionId === option.id ? null : option.id"
            @keydown.enter.prevent="selectedOptionId = selectedOptionId === option.id ? null : option.id"
            @keydown.space.prevent="selectedOptionId = selectedOptionId === option.id ? null : option.id"
          >
            <img
              v-if="questions.algorithm === ActivityType.CompleteSentencesByDraggingCluesPics "
              :src="option.image"
              :alt="option.value"
              class="w-full h-full object-contain"
            />
            <template v-else>{{ option.value }}</template>
          </Draggable>
        </div>

        <!-- Questions -->
        <div
          v-for="(question, i) in props.questions.questions"
          :key="i"
          class="flex gap-2 rounded-md bg-picton-blue-50 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 sm:gap-2.5 sm:p-2.5 md:items-center md:gap-4 md:p-3"
          :class="showResults ? (isCorrectAnswer(answers[i]?.value, question.answer) ? 'bg-green-100' : 'bg-red-100') : ''"
          role="group"
          tabindex="0"
          :aria-labelledby="`complete-sentences-dragging-clues-question-${i}`"
          :aria-describedby="showResults ? `complete-sentences-dragging-clues-result-${i}` : undefined"
        >
          <div class="flex flex-col md:flex-row items-start gap-2">
            <img
              v-if="question.image"
              :src="question.image"
              alt="question"
              class="h-14 min-w-[4.5rem] rounded-md object-cover sm:h-16 sm:min-w-20 md:h-20 md:min-w-24"
            />

            <div class="flex min-w-0 flex-wrap items-center gap-1.5 leading-snug sm:gap-2 sm:leading-normal">
              <span
                :id="`complete-sentences-dragging-clues-question-${i}`"
                class="mr-0.5 shrink-0 text-base font-bold text-picton-blue-700 sm:text-lg md:text-xl"
              >
                {{ i + 1 }}.
              </span>

              <template v-for="(part, idx) in questionParts(question.question)" :key="idx">
                <span v-if="part" class="min-w-0 whitespace-pre-wrap text-picton-blue-950">
                  {{ part }}
                </span>

                <template v-if="idx < questionParts(question.question).length - 1">
                  <Droppable
                    v-if="!answers[i]"
                    :id="`${i}%blank-${idx}`"
                    :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                    :aria-label="ariaBlankDrop(i, idx)"
                    role="button"
                    tabindex="0"
                    class="flex min-h-[3rem] min-w-[6.5rem] max-w-[min(100%,12.5rem)] items-center justify-center rounded border border-picton-blue-300 bg-picton-blue-100 px-2 py-1.5 text-sm leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 sm:min-h-[3.25rem] sm:min-w-[7.5rem] sm:max-w-[14rem] sm:text-base md:min-w-32 md:max-w-[17rem] md:text-lg"
                    @click="placeSelectedOption(i)"
                    @keydown.enter.prevent="placeSelectedOption(i)"
                    @keydown.space.prevent="placeSelectedOption(i)"
                  >
                    <span class="line-clamp-2 text-center text-picton-blue-700">
                      {{ blankDropZoneLabel }}
                    </span>
                  </Droppable>
                  <Draggable
                    v-else
                    :id="`${i}%${answers[i].optionId}%blank-${idx}`"
                    :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                    :aria-label="`Placed answer ${answers[i].value} for question ${i + 1}. Activate to remove it.`"
                    role="button"
                    tabindex="0"
                    class="flex min-h-[3rem] min-w-[6.5rem] max-w-[min(100%,12.5rem)] items-center border border-lemon-400 bg-lemon-100 p-2 text-sm leading-snug text-lemon-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 sm:min-h-[3.25rem] sm:min-w-[7.5rem] sm:max-w-[14rem] sm:text-base md:min-w-32 md:max-w-[17rem] md:text-lg"
                    :disabled="showResults"
                    @click="removeAnswer(i)"
                    @keydown.enter.prevent="removeAnswer(i)"
                    @keydown.space.prevent="removeAnswer(i)"
                  >
                    <img
                      v-if="answers[i].image"
                      :src="answers[i].image"
                      :alt="answers[i].value"
                      class="w-full h-full object-contain"
                    />
                    <span v-else class="line-clamp-4 w-full text-center break-words">{{ answers[i].value }}</span>
                  </Draggable>

                  <Icon
                    v-if="showResults"
                    :icon="isCorrectAnswer(answers[i]?.value, question.answer) ? 'mdi:check' : 'mdi:close'"
                    :class="[
                      'h-5 w-5 shrink-0 sm:h-6 sm:w-6',
                      isCorrectAnswer(answers[i]?.value, question.answer) ? 'text-green-600' : 'text-red-600',
                    ]"
                    aria-hidden="true"
                  />
                </template>
              </template>
            </div>
          </div>
          <span
            v-if="showResults"
            :id="`complete-sentences-dragging-clues-result-${i}`"
            class="sr-only"
          role="status"
        >
            {{ ui.formatQuestionResult(i + 1, isCorrectAnswer(answers[i]?.value, question.answer)) }}
          </span>
        </div>
      </DNDContext>

      <ActivityResults
        v-if="showResults"
        :score="score"
        :total="props.questions.questions.length"
        :onRestart="handleTryAgain"
        class-name="mt-2"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      :onRestart="handleTryAgain"
      :onOpenChange="(open:any) => {
        allAnswered = open;
        if (!open) showResults = true;
      }"
    />
  </section>
</template>
