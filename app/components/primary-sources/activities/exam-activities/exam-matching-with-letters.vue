<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DNDContext from "~/components/layout/dnd-context";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";
import { Button } from "~/components/ui/button";
import { cn, shuffle, toRoman } from "~/utilities/utils";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamMatchingWithLettersProps = {
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
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = defineProps<ExamMatchingWithLettersProps>();

const isKweliMode = computed(() => props.questions.mode === "kweliSikweli");

const kweliSelections = ref<("T" | "F" | undefined)[]>([]);
type KweliBoxStatus = "empty" | "correct" | "wrong";
const kweliBoxStatus = ref<KweliBoxStatus[]>([]);
const kweliCurrentIndex = ref(0);

const resetKweliFlow = () => {
  const n = props.questions.questions.length;
  kweliSelections.value = Array.from({ length: n }, () => undefined);
  kweliBoxStatus.value = Array.from({ length: n }, () => "empty" as KweliBoxStatus);
  kweliCurrentIndex.value = 0;
};

watch(
  () => [props.questions.mode, props.questions.questions.length] as const,
  () => {
    resetKweliFlow();
  },
  { immediate: true },
);

const createShuffledAnswers = (
  answers: string[],
  questions: ExamMatchingWithLettersProps["questions"]["questions"],
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
      contentToLetterMap.set(part.content, (parts as any[])[newIndex].prefix as string);
    }
  });

  const correctAnswerMapping = new Map<string, string>();
  questions.forEach((question) => {
    const originalContent = parts.find((part) => part.prefix === question.correctAnswer)?.content;
    if (originalContent) {
      const newLetter = contentToLetterMap.get(originalContent);
      if (newLetter) {
        correctAnswerMapping.set(question.id, newLetter);
      }
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

const { playSound } = useSoundEffects();
const { collectAnswers, updateActivityScore } = useExamContext();

const initialLetterState =
  props.questions.answers?.length && !isKweliMode.value
    ? createShuffledAnswers([...props.questions.answers], props.questions.questions)
    : emptyLetterState();

const shuffledAnswers = ref(initialLetterState.shuffledAnswers);
const correctAnswerMapping = ref(initialLetterState.correctAnswerMapping);

watch(
  () => props.questions,
  () => {
    answers.value = [];
    if (isKweliMode.value) {
      resetKweliFlow();
    }
    if (!isKweliMode.value && props.questions.answers?.length) {
      const next = createShuffledAnswers([...props.questions.answers], props.questions.questions);
      shuffledAnswers.value = next.shuffledAnswers;
      correctAnswerMapping.value = next.correctAnswerMapping;
    } else if (!isKweliMode.value) {
      const next = emptyLetterState();
      shuffledAnswers.value = next.shuffledAnswers;
      correctAnswerMapping.value = next.correctAnswerMapping;
    }
  },
  { deep: true },
);

const totalQuestions = computed(() => props.questions.questions.length);
const availableAnswers = computed(() =>
  shuffledAnswers.value.filter((answer) => !answers.value.includes(answer.letter)),
);

const kweliRoundComplete = computed(
  () =>
    isKweliMode.value &&
    kweliBoxStatus.value.length > 0 &&
    kweliBoxStatus.value.every((b) => b !== "empty"),
);

const kweliDisplayIndex = computed(() => {
  if (!isKweliMode.value) return 0;
  if (kweliRoundComplete.value) {
    return Math.max(0, props.questions.questions.length - 1);
  }
  return kweliCurrentIndex.value;
});

const kweliActiveQuestion = computed(() => {
  if (!isKweliMode.value) return null;
  const list = props.questions.questions;
  const i = kweliDisplayIndex.value;
  return list[i] ?? null;
});

const kweliLabel = (v: "T" | "F" | undefined) =>
  v === "T" ? "Kweli" : v === "F" ? "Si Kweli" : "";

const pickKweli = (choice: "T" | "F") => {
  if (!isKweliMode.value || kweliRoundComplete.value) return;

  const i = kweliCurrentIndex.value;
  const q = props.questions.questions[i];
  if (!q) return;

  const isCorrect = choice === q.correctAnswer;

  const boxes = [...kweliBoxStatus.value];
  boxes[i] = isCorrect ? "correct" : "wrong";
  kweliBoxStatus.value = boxes;

  const sel = [...kweliSelections.value];
  sel[i] = choice;
  kweliSelections.value = sel;

  playSound(isCorrect ? "correct" : "failure");

  if (i < props.questions.questions.length - 1) {
    kweliCurrentIndex.value = i + 1;
  }
};

const calculateScore = () => {
  let score = 0;
  const detailedAnswers: QuestionAnswer[] = [];

  if (isKweliMode.value) {
    props.questions.questions.forEach((question, index) => {
      const userAnswer = kweliSelections.value[index] || "";
      const correctAnswer = question.correctAnswer;
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        score++;
      }

      detailedAnswers.push({
        questionId: question.id,
        userAnswer: kweliLabel(userAnswer as "T" | "F" | undefined) || userAnswer,
        correctAnswer: kweliLabel(correctAnswer as "T" | "F") || correctAnswer,
        isCorrect,
        question: question.text,
        image: props.questions.sharedImage || question.image,
        options: ["Kweli", "Si Kweli"],
      });
    });

    return { score, answers: detailedAnswers };
  }

  props.questions.questions.forEach((question, index) => {
    const userAnswer = answers.value[index] || "";
    const correctAnswer = correctAnswerMapping.value.get(question.id) || "";
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) {
      score++;
    }

    detailedAnswers.push({
      questionId: question.id,
      userAnswer,
      correctAnswer,
      isCorrect,
      question: question.text,
      image: question.image,
      options: shuffledAnswers.value.map((answer) => answer.display),
    });
  });

  return { score, answers: detailedAnswers };
};

const reportProgress = () => {
  if (isKweliMode.value) {
    const answeredCount = kweliSelections.value.filter((a) => a !== undefined).length;
    props.onStateUpdate?.(totalQuestions.value, answeredCount);
    return;
  }
  const answeredCount = answers.value.filter((answer) => answer !== undefined).length;
  props.onStateUpdate?.(totalQuestions.value, answeredCount);
};

watch([answers, kweliSelections], reportProgress, { deep: true, immediate: true });

watch(
  [answers, kweliSelections, collectAnswers],
  () => {
    if (!collectAnswers.value) return;

    const { score, answers: detailedAnswers } = calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
      answers: detailedAnswers,
    });
  },
  { deep: true },
);

const handleDragEnd = (event: DragEndEvent) => {
  if (isKweliMode.value) return;

  const draggedItemLetter = event.active?.id;
  if (!draggedItemLetter) return;

  if (!event.over) {
    playSound("click");
    answers.value = answers.value.map((answer) =>
      answer === draggedItemLetter ? undefined : answer,
    );
    return;
  }

  const targetQuestionIndex = Number(event.over.id.toString().replace("q-", ""));
  if (Number.isNaN(targetQuestionIndex)) return;

  playSound("click");

  const nextAnswers = [...answers.value];
  const currentIndex = nextAnswers.findIndex((answer) => answer === draggedItemLetter);

  if (nextAnswers[targetQuestionIndex]) {
    const existingAnswer = nextAnswers[targetQuestionIndex];

    if (currentIndex !== -1) {
      nextAnswers[currentIndex] = existingAnswer;
    } else {
      const emptyIndex = nextAnswers.findIndex((answer) => !answer);
      if (emptyIndex !== -1 && existingAnswer) {
        nextAnswers[emptyIndex] = existingAnswer;
      }
    }
  } else if (currentIndex !== -1) {
    nextAnswers[currentIndex] = undefined;
  }

  nextAnswers[targetQuestionIndex] = draggedItemLetter;
  answers.value = nextAnswers;
};
</script>

<template>
  <div class="flex h-full flex-col">
    <div
      v-if="isKweliMode"
      class="flex flex-col gap-6 overflow-auto rounded-xl bg-white p-4 pb-2 md:max-h-[calc(100dvh-100px)]"
    >
      <div
        v-if="kweliActiveQuestion"
        class="flex flex-col gap-4 rounded-lg border border-picton-blue-100 bg-picton-blue-50/60 p-4"
      >
        <p class="text-lg text-picton-blue-800">
          {{ toRoman(kweliDisplayIndex + 1) }}. {{ kweliActiveQuestion.text }}
        </p>

        <div
          v-if="!kweliRoundComplete"
          class="flex flex-wrap items-center justify-center gap-4 sm:justify-start"
        >
          <Button
            type="button"
            variant="outline"
            :class="
              cn(
                'h-12 min-w-[6.5rem] text-base font-semibold sm:h-14 sm:min-w-[7.5rem] sm:text-lg',
              )
            "
            @click="pickKweli('T')"
          >
            Kweli
          </Button>
          <Button
            type="button"
            variant="outline"
            :class="
              cn(
                'h-12 min-w-[6.5rem] text-base font-semibold sm:h-14 sm:min-w-[7.5rem] sm:text-lg',
              )
            "
            @click="pickKweli('F')"
          >
            Si Kweli
          </Button>
        </div>

        <p
          v-else
          class="text-center text-base font-medium text-picton-blue-600"
        >
          Umekamilisha maswali yote.
        </p>

        <img
          v-if="props.questions.sharedImage"
          :src="props.questions.sharedImage"
          alt=""
          class="mx-auto max-h-56 w-full max-w-lg rounded-lg object-contain"
        >
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-center text-sm font-medium text-picton-blue-700">
          Maendeleo
        </p>
        <div class="flex flex-wrap justify-center gap-2 sm:gap-3">
          <div
            v-for="(status, idx) in kweliBoxStatus"
            :key="idx"
            :class="
              cn(
                'flex h-11 w-11 items-center justify-center rounded-lg border-2 text-base font-bold transition-all sm:h-12 sm:w-12 sm:text-lg',
                status === 'empty' &&
                  'border-dashed border-picton-blue-200 bg-white/70 text-picton-blue-400',
                status === 'correct' &&
                  'border-green-500 bg-emerald-50 text-green-700 shadow-sm',
                status === 'wrong' && 'border-red-500 bg-red-50 text-red-700 shadow-sm',
                idx === kweliCurrentIndex &&
                  status === 'empty' &&
                  !kweliRoundComplete &&
                  'ring-2 ring-oceanBlue ring-offset-2',
              )
            "
          >
            <span v-if="status === 'empty'">{{ idx + 1 }}</span>
            <span v-else-if="status === 'correct'">✓</span>
            <span v-else>✕</span>
          </div>
        </div>
      </div>
    </div>

    <DNDContext v-else :onDragEnd="handleDragEnd">
      <div class="flex h-full flex-col justify-between overflow-auto pb-2 md:flex-row">
        <div class="flex w-full flex-col justify-between bg-white p-4 md:max-h-[calc(100dvh-100px)] md:rounded-bl-xl">
          <div class="flex flex-col gap-y-4">
            <div
              v-for="(question, index) in props.questions.questions"
              :key="question.id"
              class="flex items-center gap-4 text-lg text-picton-blue-700"
            >
              <p>{{ toRoman(index + 1) }}.</p>
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
                  <Draggable
                    v-if="answers[index]"
                    :id="answers[index]!"
                    class="flex h-10 w-14 cursor-move items-center justify-center rounded bg-lemon-200 text-xl font-semibold text-lemon-700"
                  >
                    {{ answers[index] }}
                  </Draggable>
                  <Droppable
                    v-else
                    :id="`q-${index}`"
                    class="h-10 w-14 rounded bg-picton-blue-200"
                    isOverClassName="bg-lemon-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex w-full flex-col gap-y-4 rounded-xl">
            <h3 class="mb-2 font-semibold">Options</h3>
            <div class="flex flex-wrap gap-4 text-lg">
              <Draggable
                v-for="answer in availableAnswers"
                :key="answer.letter"
                :id="(answer.letter as string)"
                class="flex h-10 w-14 cursor-move items-center justify-center rounded bg-lemon-200 text-xl font-semibold text-lemon-700"
              >
                <span>{{ answer.letter }}</span>
              </Draggable>
            </div>
            <div v-if="!availableAnswers.length" class="py-4 text-center text-gray-500">
              All options have been used
            </div>
          </div>
        </div>

        <div class="flex w-full flex-col gap-4 overflow-auto bg-white p-4 text-lg md:max-h-[calc(100dvh-100px)] md:rounded-bl-none md:rounded-br-xl">
          <div v-for="answer in shuffledAnswers" :key="answer.display" class="flex items-center gap-4">
            <p>
              <span class="text-xl font-semibold">{{ answer.display.slice(0, 1) }})</span>
              <span>{{ answer.display.slice(2) }}</span>
            </p>
            <div class="h-10" />
          </div>
        </div>
      </div>
    </DNDContext>
  </div>
</template>
