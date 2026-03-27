<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DNDContext from "@/components/layout/dnd-context";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { shuffle } from "@/lib/utils";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    questions: {
      id: string;
      text: string;
      image?: string;
      correctAnswer: string;
    }[];
    answers: string[];
  };
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

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

const answers = ref<(string | undefined)[]>([]);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const shuffledState = ref(createShuffledAnswers([...props.questions.answers], props.questions.questions));

watch(
  () => props.questions,
  () => {
    answers.value = [];
    score.value = 0;
    allAnswered.value = false;
    showResults.value = false;
    shuffledState.value = createShuffledAnswers(
      [...props.questions.answers],
      props.questions.questions,
    );
  },
  { deep: true, immediate: true },
);

watch(
  answers,
  (value) => {
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
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  shuffledState.value = createShuffledAnswers(
    [...props.questions.answers],
    props.questions.questions,
  );
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <DNDContext :onDragEnd="handleDragEnd">
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
