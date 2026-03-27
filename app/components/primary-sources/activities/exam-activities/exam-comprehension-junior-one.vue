<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Textarea } from "~/components/ui/textarea";
import { AnswerChecker } from "~/lib/utils/answer-checker";
import { toRoman } from "~/utilities/utils";
import { useExamContext } from "~/shared/context/exam-context";

type ExamComprehensionJuniorOneProps = {
  questions: {
    title: string;
    algorithm: "Comprehension junior one" | "Comprehension junior two";
    notes: string;
    image?: string;
    optionsTitle?: string;
    useAI?: boolean;
    questions: {
      question: string;
      image?: string;
      answers: string[];
      options: {
        id: string;
        text: string;
      }[];
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamComprehensionJuniorOneProps>();

const answerChecker = new AnswerChecker();
const { collectAnswers, updateActivityScore } = useExamContext();

const allUserAnswers = ref<Record<number, string[]>>({});
const isCheckingAnswers = ref(false);
const totalQuestions = computed(() => props.questions.questions.length);

const answeredCount = computed(() =>
  Object.values(allUserAnswers.value).reduce(
    (total, questionAnswers) =>
      total + questionAnswers.filter((answer) => answer.trim() !== "").length,
    0,
  ),
);

const calculateScore = async () => {
  try {
    isCheckingAnswers.value = true;

    const submissions: { questionId: string; answer: string }[] = [];
    const aiQuestions: {
      id: string;
      question: string;
      acceptedAnswers: string[];
      strictMode: boolean;
      maxMarks: number;
      questionType: "reasoning";
      context: Record<string, unknown>;
      evaluationCriteria: string;
    }[] = [];

    props.questions.questions.forEach((question, questionIndex) => {
      const userAnswers = allUserAnswers.value[questionIndex] || [];

      userAnswers.forEach((answer, answerIndex) => {
        if (!answer.trim()) return;

        const questionId = `q${questionIndex}-a${answerIndex}`;
        submissions.push({
          questionId,
          answer: answer.trim(),
        });

        aiQuestions.push({
          id: questionId,
          question: question.question,
          acceptedAnswers: question.answers[answerIndex] ? [question.answers[answerIndex]] : [],
          strictMode: false,
          maxMarks: 1,
          questionType: "reasoning",
          context: {
            readingMaterial: props.questions.notes,
            activityTitle: props.questions.title,
          },
          evaluationCriteria:
            "Evaluate this answer based on understanding of the reading material and semantic similarity to the accepted answer.",
        });
      });
    });

    if (!submissions.length) {
      return { score: 0 };
    }

    const results =
      props.questions.useAI
        ? await answerChecker.checkAnswersWithAI(submissions, aiQuestions)
        : submissions.map((submission) => ({
            questionId: submission.questionId,
            result: answerChecker.checkAnswer(submission.answer, {
              acceptedAnswers:
                aiQuestions.find((question) => question.id === submission.questionId)?.acceptedAnswers || [],
            }),
          }));

    const score = results.reduce((total, result) => total + result.result.marksAwarded, 0);
    return { score };
  } finally {
    isCheckingAnswers.value = false;
  }
};

const ensureQuestionAnswers = (questionIndex: number, answerCount: number) =>
  allUserAnswers.value[questionIndex] || Array.from({ length: answerCount }, () => "");

const handleInputChange = (questionIndex: number, answerIndex: number, value: string | number) => {
  const nextQuestionAnswers = [...ensureQuestionAnswers(
    questionIndex,
    (props.questions.questions as any[])[questionIndex].answers.length,
  )];

  nextQuestionAnswers[answerIndex] = String(value ?? "");

  allUserAnswers.value = {
    ...allUserAnswers.value,
    [questionIndex]: nextQuestionAnswers,
  };
};

watch(answeredCount, (value) => {
  props.onStateUpdate?.(totalQuestions.value, value);
});

watch(
  [allUserAnswers, collectAnswers],
  async () => {
    if (!collectAnswers.value) return;

    const { score } = await calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
    });
  },
  { deep: true },
);
</script>

<template>
  <div class="flex h-full flex-col rounded-xl bg-white shadow-sm">
    <div class="flex h-full gap-2">
      <div class="flex w-1/2 flex-col justify-start rounded-xl bg-white p-6">
        <div class="max-h-[calc(100vh-200px)] overflow-auto">
          <div
            class="whitespace-pre-line text-base leading-relaxed text-picton-blue-700"
            v-html="props.questions.notes"
          />
        </div>
      </div>

      <div class="flex w-1/2 flex-col rounded-xl p-6">
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-8">
            <div
              v-for="(question, questionIndex) in props.questions.questions"
              :key="`${questionIndex}-${question.question}`"
              class="rounded-lg border bg-neutral-50 p-6 text-neutral-700"
            >
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 font-semibold">
                  {{ toRoman(questionIndex + 1) }}.
                </div>

                <div class="flex-1">
                  <div v-if="question.question.includes('___')" class="text-base leading-relaxed">
                    <template
                      v-for="(part, partIndex) in question.question.split('___')"
                      :key="`${questionIndex}-${partIndex}`"
                    >
                      <span>{{ part }}</span>
                      <span
                        v-if="partIndex < question.question.split('___').length - 1"
                        class="mx-2 inline-block align-middle"
                      >
                        <Textarea
                          :model-value="ensureQuestionAnswers(questionIndex, question.answers.length)[partIndex] || ''"
                          class="min-h-[40px] max-w-40 text-base"
                          rows="1"
                          :disabled="isCheckingAnswers"
                          @update:model-value="
                            (value) => handleInputChange(questionIndex, partIndex, value)
                          "
                        />
                      </span>
                    </template>
                  </div>

                  <div v-else class="space-y-3">
                    <p class="text-base font-medium">{{ question.question }}</p>
                    <Textarea
                      :model-value="ensureQuestionAnswers(questionIndex, question.answers.length)[0] || ''"
                      class="w-full text-base"
                      rows="1"
                      :disabled="isCheckingAnswers"
                      @update:model-value="
                        (value) => handleInputChange(questionIndex, 0, value)
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
