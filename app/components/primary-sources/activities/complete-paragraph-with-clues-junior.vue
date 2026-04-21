<script setup lang="ts">
import { Fragment, ref, watch } from "vue";
import { shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    paragraph: string;
    image: string;
    answers: string[];
    options: string[];
  };
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const showingFeedback = ref(false);
const userAnswers = ref<string[]>([]);
const remainingOptions = ref<string[]>([]);
const selectedOption = ref<string | null>(null);
const instructionsId = "complete-paragraph-with-clues-junior-instructions";

const initialize = () => {
  score.value = 0;
  allAnswered.value = false;
  showingFeedback.value = false;
  userAnswers.value = Array.from({ length: props.questions.answers.length }, () => "");
  remainingOptions.value = shuffle([...props.questions.options]);
  selectedOption.value = null;
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

watch(userAnswers, (value) => {
  if (!value.every(Boolean)) return;

  score.value = value.reduce(
    (total, answer, index) => total + (answer === props.questions.answers[index] ? 1 : 0),
    0,
  );
  allAnswered.value = true;
  playSound("success");
}, { deep: true });

const handleDragEnd = (event: DragEndEvent) => {
  const activeId = String(event.active?.id || "");
  const overId = String(event.over?.id || "");
  if (!activeId || !overId) return;

  const blankIndex = Number(overId.split("%")[1]);
  const nextAnswers = [...userAnswers.value];
  const previousIndex = nextAnswers.indexOf(activeId);

  if (previousIndex !== -1) {
    nextAnswers[previousIndex] = "";
  }
  nextAnswers[blankIndex] = activeId;

  userAnswers.value = nextAnswers;
  remainingOptions.value = remainingOptions.value.filter((option) => option !== activeId);
  selectedOption.value = null;
  playSound("click");
};

const placeOptionInBlank = (blankIndex: number) => {
  if (showingFeedback.value || !selectedOption.value) return;

  const nextAnswers = [...userAnswers.value];
  const existingAnswer = nextAnswers[blankIndex];

  if (existingAnswer) {
    remainingOptions.value = [...remainingOptions.value, existingAnswer];
  }

  nextAnswers[blankIndex] = selectedOption.value;
  userAnswers.value = nextAnswers;
  remainingOptions.value = remainingOptions.value.filter((option) => option !== selectedOption.value);
  selectedOption.value = null;
  playSound("click");
};

const removeAnswerFromBlank = (blankIndex: number) => {
  if (showingFeedback.value) return;

  const nextAnswers = [...userAnswers.value];
  const existingAnswer = nextAnswers[blankIndex];
  if (!existingAnswer) return;

  nextAnswers[blankIndex] = "";
  userAnswers.value = nextAnswers;
  remainingOptions.value = shuffle([...remainingOptions.value, existingAnswer]);
  selectedOption.value = null;
};

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Complete the paragraph by matching the options to the blanks. You can drag with a pointer, or
      use the Tab key to move through the options and blanks. Activate an option to select it, then
      activate a blank to place it.
    </p>

    <DNDContext :onDragEnd="handleDragEnd">
      <div class="flex h-full flex-col gap-4">
        <div class="flex h-full flex-col gap-4 md:flex-row">
          <div
            class="flex h-full w-full flex-col justify-between overflow-auto rounded-xl bg-picton-blue-50 p-4"
            :aria-describedby="instructionsId"
          >
            <div class="text-lg leading-loose md:p-4">
              <template
                v-for="(part, index) in props.questions.paragraph.split('___')"
                :key="index"
              >
                {{ part }}
                <template v-if="index !== props.questions.paragraph.split('___').length - 1">
                  <span v-if="showingFeedback" class="relative mx-2 inline-block h-8 w-36 align-middle">
                    <span
                      :class="
                        userAnswers[index] === props.questions.answers[index]
                          ? 'inline-flex h-full w-full items-center justify-between bg-green-200 px-2 text-center text-green-800'
                          : 'inline-flex h-full w-full items-center justify-between bg-red-200 px-2 text-center text-red-800'
                      "
                    >
                      <span class="truncate">{{ userAnswers[index] !== '' ? userAnswers[index] : '-' }}</span>
                      <span class="shrink-0">
                        {{ userAnswers[index] === props.questions.answers[index] ? "✓" : "✕" }}
                      </span>
                    </span>
                    <span
                      v-if="
                        props.feedback === 'wrong-correct-answers' &&
                        userAnswers[index] !== props.questions.answers[index]
                      "
                      class="absolute -bottom-5 left-0 z-10 rounded bg-green-100 px-1 text-sm font-medium text-green-700"
                    >
                      {{ props.questions.answers[index] }}
                    </span>
                  </span>

                  <button
                    v-else-if="userAnswers[index]"
                    type="button"
                    :aria-describedby="instructionsId"
                    :aria-label="`Placed answer ${userAnswers[index]} in blank ${index + 1}. Activate to remove it.`"
                    class="mx-2 inline-flex h-8 w-36 items-center justify-center bg-lemon-200 text-center align-middle text-lemon-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                    @click="removeAnswerFromBlank(index)"
                  >
                    <span>{{ userAnswers[index] }}</span>
                  </button>

                  <button
                    v-else
                    type="button"
                    :aria-describedby="instructionsId"
                    :aria-label="
                      selectedOption
                        ? `Blank ${index + 1}. Activate to place ${selectedOption}.`
                        : `Blank ${index + 1}. Select an option first.`
                    "
                    class="mx-2 inline-flex h-8 w-36 items-center justify-center bg-picton-blue-100 align-middle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                    @click="placeOptionInBlank(index)"
                  >
                    <span class="text-sm text-picton-blue-700 opacity-50 ">
                      {{ selectedOption ? `Weka ${selectedOption}` : "Wazi" }}
                    </span>
                  </button>
                </template>
              </template>
            </div>
          </div>

          <div class="flex items-center justify-center rounded-xl bg-white p-4 text-lg md:w-1/2">
            <img
              v-if="props.questions.image"
              :src="props.questions.image"
              :alt="props.questions.title"
              class="max-h-[600px] w-full object-contain"
            >
          </div>
        </div>

        <ActivityResults
          v-if="showingFeedback"
          :score="score"
          :total="props.questions.answers.length"
          :onRestart="resetActivity"
        />

        <div v-else class="space-y-4">
          <h3 class="font-semibold">Machaguo</h3>
          <div class="flex flex-wrap gap-2 text-lg">
            <button
              v-for="(answer, index) in remainingOptions"
              :key="index"
              type="button"
              :aria-describedby="instructionsId"
              :aria-pressed="selectedOption === answer"
              :aria-label="`Option ${answer}. Activate to select it for a blank.`"
              :class="[
                'flex h-10 min-w-36 items-center justify-center gap-4 rounded bg-picton-blue-200 px-4 text-picton-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2',
                selectedOption === answer ? 'ring-2 ring-picton-blue-500 ring-offset-2' : '',
              ]"
              @click="selectedOption = selectedOption === answer ? null : answer"
            >
              <span>{{ answer }}</span>
            </button>
          </div>
        </div>
      </div>
    </DNDContext>

    <ActivityResultsAlertDialog
      :open="allAnswered"
      :score="score"
      :total="props.questions.answers.length"
      :onOpenChange="
        () => {
          allAnswered = false;
          showingFeedback = true;
        }
      "
    />
  </div>
</template>
