<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import DNDContext from "@/components/layout/dnd-context";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { cn, shuffle } from "@/lib/utils";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    mode?: "kweliSikweli";
    sharedImage?: string;
    questions: {
      id: string;
      text: string;
      image?: string;
      correctAnswer: string;
    }[];
    answers?: string[];
  };
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const isKweliMode = computed(() => props.questions.mode === "kweliSikweli");

const kweliSelections = ref<("T" | "F" | undefined)[]>([]);

watch(
  () => [props.questions.mode, props.questions.questions.length] as const,
  () => {
    kweliSelections.value = props.questions.questions.map(() => undefined);
  },
  { immediate: true },
);

const createShuffledAnswers = (
  answers: string[],
  questions: Props["questions"]["questions"],
) => {
  const parts = answers.map((answer) => {
    const [prefix, ...rest] = answer.split("|");
    return {
      prefix,
      content: rest.join(".").trim(),
    };
  });

  const shuffledContents = shuffle(parts.map((part) => part.content));
  const contentToLetterMap = new Map<string, string>();

  parts.forEach((part) => {
    const newIndex = shuffledContents.findIndex((content) => content === part.content);
    if (newIndex !== -1) {
      contentToLetterMap.set(part.content, parts[newIndex].prefix);
    }
  });

  const correctAnswerMapping = new Map<string, string>();
  questions.forEach((question) => {
    const originalContent = parts.find((part) => part.prefix === question.correctAnswer)?.content;
    if (!originalContent) return;

    const newLetter = contentToLetterMap.get(originalContent);
    if (newLetter) {
      correctAnswerMapping.set(question.id, newLetter);
    }
  });

  return {
    shuffledAnswers: parts.map((part, index) => ({
      display: `${part.prefix}. ${shuffledContents[index]}`,
      letter: part.prefix,
      content: shuffledContents[index],
    })),
    correctAnswerMapping,
  };
};

const emptyLetterState = () => ({
  shuffledAnswers: [] as { display: string; letter: string; content: string }[],
  correctAnswerMapping: new Map<string, string>(),
});

const answers = ref<(string | undefined)[]>([]);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const shuffledState = ref(
  props.questions.answers?.length && props.questions.mode !== "kweliSikweli"
    ? createShuffledAnswers([...props.questions.answers], props.questions.questions)
    : emptyLetterState(),
);

watch(
  () => props.questions,
  () => {
    answers.value = [];
    score.value = 0;
    allAnswered.value = false;
    showResults.value = false;
    if (!isKweliMode.value && props.questions.answers?.length) {
      shuffledState.value = createShuffledAnswers(
        [...props.questions.answers],
        props.questions.questions,
      );
    } else if (!isKweliMode.value) {
      shuffledState.value = emptyLetterState();
    }
  },
  { deep: true, immediate: true },
);

watch(
  kweliSelections,
  (value) => {
    if (!isKweliMode.value) return;
    const complete =
      value.length === props.questions.questions.length &&
      !value.includes(undefined);
    if (!complete) {
      allAnswered.value = false;
      return;
    }
    score.value = value.reduce((total, answer, index) => {
      const q = props.questions.questions[index];
      return total + (answer === q.correctAnswer ? 1 : 0);
    }, 0);
    allAnswered.value = true;
    playSound("success");
  },
  { deep: true },
);

const setKweliAnswer = (index: number, choice: "T" | "F") => {
  if (showResults.value) return;
  const next = [...kweliSelections.value];
  next[index] = choice;
  kweliSelections.value = next;
  playSound("click");
};

const kweliLabel = (v: "T" | "F" | undefined) =>
  v === "T" ? "Kweli" : v === "F" ? "Si Kweli" : "";

watch(
  answers,
  (value) => {
    if (isKweliMode.value) return;
    if (value.length === props.questions.questions.length && !value.includes(undefined)) {
      score.value = value.reduce((total, answer, index) => {
        const question = props.questions.questions[index];
        return total + (answer === shuffledState.value.correctAnswerMapping.get(question.id) ? 1 : 0);
      }, 0);
      allAnswered.value = true;
      playSound("success");
    }
  },
  { deep: true },
);

const availableAnswers = computed(() =>
  shuffledState.value.shuffledAnswers.filter((answer) => !answers.value.includes(answer.letter)),
);

const isAnswerCorrect = (questionIndex: number) => {
  const question = props.questions.questions[questionIndex];
  if (isKweliMode.value) {
    return kweliSelections.value[questionIndex] === question.correctAnswer;
  }
  return answers.value[questionIndex] === shuffledState.value.correctAnswerMapping.get(question.id);
};

const handleDragEnd = (event: DragEndEvent) => {
  if (showResults.value) return;

  const draggedId = String(event.active?.id || "");
  if (!draggedId) return;

  if (!event.over) {
    answers.value = answers.value.map((answer) => (answer === draggedId ? undefined : answer));
    playSound("click");
    return;
  }

  const dropQuestion = props.questions.questions.find(
    (question) => question.id === String(event.over?.id),
  );

  if (!dropQuestion) return;

  const nextAnswers = [...answers.value];
  const existingIndex = nextAnswers.findIndex((answer) => answer === draggedId);
  if (existingIndex !== -1) {
    nextAnswers[existingIndex] = undefined;
  }

  nextAnswers[Number.parseInt(dropQuestion.id, 10) - 1] = draggedId;
  answers.value = nextAnswers;
  playSound("click");
};

const resetActivity = () => {
  answers.value = [];
  kweliSelections.value = props.questions.questions.map(() => undefined);
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  if (!isKweliMode.value && props.questions.answers?.length) {
    shuffledState.value = createShuffledAnswers(
      [...props.questions.answers],
      props.questions.questions,
    );
  }
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="isKweliMode"
      class="flex flex-col gap-4 overflow-auto rounded-xl bg-picton-blue-50/80 p-4 md:max-h-[calc(100dvh-100px)] md:overflow-y-auto"
    >
      <div class="flex flex-col gap-6">
        <div
          v-for="(question, index) in props.questions.questions"
          :key="question.id"
          class="flex flex-col gap-3 rounded-lg border border-picton-blue-100 bg-white/90 p-4 shadow-sm"
        >
          <p class="text-lg font-medium text-picton-blue-800">
            {{ index + 1 }}. {{ question.text }}
          </p>

          <template v-if="!showResults">
            <div class="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <Button
                type="button"
                :variant="kweliSelections[index] === 'T' ? 'default' : 'outline'"
                :class="
                  cn(
                    'h-12 min-w-[6.5rem] text-base font-semibold sm:h-14 sm:min-w-[7.5rem] sm:text-lg',
                  )
                "
                @click="setKweliAnswer(index, 'T')"
              >
                Kweli
              </Button>
              <Button
                type="button"
                :variant="kweliSelections[index] === 'F' ? 'default' : 'outline'"
                :class="
                  cn(
                    'h-12 min-w-[6.5rem] text-base font-semibold sm:h-14 sm:min-w-[7.5rem] sm:text-lg',
                  )
                "
                @click="setKweliAnswer(index, 'F')"
              >
                Si Kweli
              </Button>
            </div>
          </template>

          <div
            v-else
            class="flex flex-wrap items-center gap-3 text-base sm:text-lg"
          >
            <span
              :class="
                isAnswerCorrect(index) ? 'font-semibold text-green-700' : 'font-semibold text-red-700'
              "
            >
              {{ kweliLabel(kweliSelections[index]) }}
            </span>
            <span :class="isAnswerCorrect(index) ? 'text-green-500' : 'text-red-500'">
              {{ isAnswerCorrect(index) ? "✓" : "✕" }}
            </span>
          </div>

          <img
            v-if="props.questions.sharedImage"
            :src="props.questions.sharedImage"
            alt=""
            class="mx-auto max-h-56 w-full max-w-lg rounded-lg object-contain"
          >
        </div>
      </div>

      <div class="mt-2 w-full">
        <ActivityResults
          v-if="showResults"
          :score="score"
          :total="props.questions.questions.length"
          :onRestart="resetActivity"
        />
      </div>
    </div>

    <DNDContext v-else :onDragEnd="handleDragEnd">
      <div class="flex h-full flex-col justify-between gap-4 overflow-auto md:flex-row">
        <div class="flex w-full flex-col justify-between rounded-xl bg-picton-blue-50 p-4 md:max-h-[calc(100dvh-100px)] md:overflow-y-auto">
          <div class="flex flex-col gap-y-4">
            <div
              v-for="(question, index) in props.questions.questions"
              :key="question.id"
              class="flex items-center gap-4 text-lg text-picton-blue-700"
            >
              <p>{{ index + 1 }}.</p>
              <div class="flex w-full items-center justify-between gap-4">
                <div class="flex flex-col items-center gap-2 sm:flex-row">
                  <img
                    v-if="question.image"
                    :src="question.image"
                    :alt="question.text"
                    class="h-16 sm:h-24"
                  >
                  <span>{{ question.text }}</span>
                </div>

                <div class="flex items-center gap-2">
                  <template v-if="answers[index]">
                    <div
                      v-if="showResults"
                      :class="
                        isAnswerCorrect(index)
                          ? 'flex h-10 w-14 items-center justify-center rounded bg-green-100 text-green-700'
                          : 'flex h-10 w-14 items-center justify-center rounded bg-red-100 text-red-700'
                      "
                    >
                      {{ answers[index] }}
                    </div>
                    <Draggable
                      v-else
                      :id="answers[index]!"
                      class="flex h-10 w-14 items-center justify-center rounded bg-lemon-200 text-xl font-semibold text-lemon-700"
                    >
                      {{ answers[index] }}
                    </Draggable>

                    <div v-if="showResults" :class="isAnswerCorrect(index) ? 'text-green-500' : 'text-red-500'">
                      {{ isAnswerCorrect(index) ? "✓" : "✕" }}
                    </div>
                  </template>

                  <Droppable
                    v-else
                    :id="question.id"
                    class="h-10 w-14 rounded bg-picton-blue-200"
                    isOverClassName="bg-lemon-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex w-full flex-col gap-y-4 rounded-xl">
            <ActivityResults
              v-if="showResults"
              :score="score"
              :total="props.questions.questions.length"
              :onRestart="resetActivity"
            />
            <template v-else>
              <h3 class="mb-2 font-semibold">Options</h3>
              <div class="flex flex-wrap gap-4 text-lg">
                <Draggable
                  v-for="(answer, index) in availableAnswers"
                  :key="index"
                  :id="answer.letter"
                  class="flex h-10 w-14 items-center justify-center rounded bg-lemon-200 text-xl font-semibold text-lemon-700"
                >
                  <span>{{ answer.letter }}</span>
                </Draggable>
              </div>
            </template>
          </div>
        </div>

        <div class="flex w-full flex-col gap-4 rounded-xl bg-picton-blue-50 p-4 text-lg md:max-h-[calc(100dvh-100px)] md:overflow-auto">
          <div
            v-for="(answer, index) in shuffledState.shuffledAnswers"
            :key="index"
            class="flex items-center gap-4"
          >
            <p>
              <span class="text-xl font-semibold">{{ answer.display.slice(0, 1) }})</span>
              <span>{{ answer.display.slice(2) }}</span>
            </p>
            <div class="h-10" />
          </div>
        </div>
      </div>
    </DNDContext>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered && !showResults"
      :onOpenChange="
        (open: boolean) => {
          allAnswered = false;
          if (!open) {
            showResults = true;
          }
        }
      "
    />
  </div>
</template>
