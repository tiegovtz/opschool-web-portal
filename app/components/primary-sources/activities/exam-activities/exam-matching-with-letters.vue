<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DNDContext from "~/components/layout/dnd-context";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";
import { shuffle, toRoman } from "~/utilities/utils";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamMatchingWithLettersProps = {
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
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = defineProps<ExamMatchingWithLettersProps>();

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

const answers = ref<(string | undefined)[]>([]);

const { playSound } = useSoundEffects();
const { collectAnswers, updateActivityScore } = useExamContext();

const initialShuffledState = createShuffledAnswers(
  [...props.questions.answers],
  props.questions.questions,
);

const shuffledAnswers = ref(initialShuffledState.shuffledAnswers);
const correctAnswerMapping = ref(initialShuffledState.correctAnswerMapping);

const totalQuestions = computed(() => props.questions.questions.length);
const availableAnswers = computed(() =>
  shuffledAnswers.value.filter((answer) => !answers.value.includes(answer.letter)),
);

const calculateScore = () => {
  let score = 0;
  const detailedAnswers: QuestionAnswer[] = [];

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

watch(
  answers,
  () => {
    const answeredCount = answers.value.filter((answer) => answer !== undefined).length;
    props.onStateUpdate?.(totalQuestions.value, answeredCount);
  },
  { deep: true },
);

watch(
  [answers, collectAnswers],
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
    <DNDContext :onDragEnd="handleDragEnd">
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
