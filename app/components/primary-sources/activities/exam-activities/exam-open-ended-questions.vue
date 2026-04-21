<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { refDebounced } from "@vueuse/core";
import ActivityTitle from "~/components/templates/activity-title";
import { Textarea } from "~/components/ui/textarea";
import { ImageModal } from "~/components/ui/image-modal";
import { AnswerChecker } from "~/lib/utils/answer-checker";
import { cn } from "~/utilities/utils";
import { useExamContext, type QuestionAnswer } from "~/shared/context/exam-context";

type ExamQuestion = {
  id: string;
  questionNumber: string;
  questionText?: string;
  imagePath?: string;
  useAI?: boolean;
  hint?: string;
  acceptedAnswers?: string[];
  maxMarks?: number;
  parts: {
    id: string;
    partLabel: string;
    questionText?: string;
    maxMarks?: number;
    useAI?: boolean;
    hint?: string;
    acceptedAnswers?: string[];
    subQuestions: {
      id: string;
      subLabel: string;
      questionText: string;
      maxMarks: number;
      useAI?: boolean;
      hint?: string;
      acceptedAnswers?: string[];
      evaluationCriteria?: string;
    }[];
  }[];
};

type ExamOpenEndedQuestionsProps = {
  questions: {
    title: string;
    fontSize?: string;
    questions: ExamQuestion[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamOpenEndedQuestionsProps>();

const answerChecker = new AnswerChecker();
const ui = useActivityUiText();
const { collectAnswers, updateActivityScore } = useExamContext();

const answers = ref<Record<string, string>>({});
const isCalculatingScore = ref(false);
const debouncedAnswers = refDebounced(answers, 500);
const activityInstructionsId = "exam-open-ended-instructions";
const activityStatusId = "exam-open-ended-status";
const keyboardStatusMessage = ref("");

const totalQuestions = computed(() =>
  props.questions.questions.reduce(
    (total, question) =>
      total +
      (question.maxMarks ? 1 : 0) +
      question.parts.reduce(
        (partTotal, part) =>
          partTotal + part.subQuestions.length + (part.maxMarks ? 1 : 0),
        0,
      ),
    0,
  ),
);

const debouncedAnsweredCount = computed(
  () =>
    Object.values(debouncedAnswers.value).filter((answer) => answer?.trim() !== "").length,
);

const answerValue = (questionId: string) => answers.value[questionId] || "";

const handleInputChange = (questionId: string, value: string | number) => {
  answers.value = {
    ...answers.value,
    [questionId]: String(value ?? ""),
  };
  keyboardStatusMessage.value = ui.formatActivityUpdated(questionId, value);
};

const calculateScore = async () => {
  if (isCalculatingScore.value || !Object.keys(debouncedAnswers.value).length) {
    return { score: 0, answers: [] as QuestionAnswer[] };
  }

  isCalculatingScore.value = true;

  try {
    const submissions: { questionId: string; answer: string }[] = [];
    const questionsForChecking: {
      id: string;
      question: string;
      acceptedAnswers?: string[];
      questionType: "reasoning" | "exact";
      maxMarks?: number;
      hint?: string;
      imagePath?: string;
      context?: Record<string, unknown>;
      evaluationCriteria?: string;
    }[] = [];

    props.questions.questions.forEach((question) => {
      if (question.maxMarks) {
        const questionAnswerId = `${question.id}-answer`;
        submissions.push({
          questionId: questionAnswerId,
          answer: debouncedAnswers.value[questionAnswerId] || "",
        });

        questionsForChecking.push({
          id: questionAnswerId,
          question: [question.questionNumber, question.questionText].filter(Boolean).join(" "),
          acceptedAnswers: question.acceptedAnswers || [],
          questionType: question.useAI !== false ? "reasoning" : "exact",
          maxMarks: question.maxMarks,
          hint: question.hint,
          imagePath: question.imagePath,
        });
      }

      question.parts.forEach((part) => {
        const subQuestionsWithText = part.subQuestions.filter((subQuestion) => subQuestion.questionText?.trim());
        const subQuestionsWithoutText = part.subQuestions.filter((subQuestion) => !subQuestion.questionText?.trim());

        subQuestionsWithText.forEach((subQuestion) => {
          submissions.push({
            questionId: subQuestion.id,
            answer: debouncedAnswers.value[subQuestion.id] || "",
          });

          questionsForChecking.push({
            id: subQuestion.id,
            question: [subQuestion.subLabel, subQuestion.questionText].filter(Boolean).join(" "),
            context: {
              mainQuestion: `${question.questionNumber} ${question.questionText || ""}`.trim(),
              partQuestion: `${part.partLabel} ${part.questionText || ""}`.trim(),
            },
            acceptedAnswers: subQuestion.acceptedAnswers || [],
            questionType: subQuestion.useAI !== false ? "reasoning" : "exact",
            maxMarks: subQuestion.maxMarks,
            evaluationCriteria: subQuestion.evaluationCriteria,
            hint: subQuestion.hint,
            imagePath: question.imagePath,
          });
        });

        if (subQuestionsWithoutText.length) {
          const parentQuestionText = part.questionText?.trim() || question.questionText?.trim();

          subQuestionsWithoutText.forEach((subQuestion) => {
            submissions.push({
              questionId: subQuestion.id,
              answer: debouncedAnswers.value[subQuestion.id] || "",
            });

            questionsForChecking.push({
              id: subQuestion.id,
              question: `${parentQuestionText || ""} - ${subQuestion.subLabel}`.trim(),
              context: {
                mainQuestion: `${question.questionNumber} ${question.questionText || ""}`.trim(),
                partLabel: part.partLabel,
                parentText: parentQuestionText,
                subLabel: subQuestion.subLabel,
                isGroupedSubQuestion: true,
              },
              acceptedAnswers: subQuestion.acceptedAnswers || [],
              questionType: subQuestion.useAI !== false ? "reasoning" : "exact",
              maxMarks: subQuestion.maxMarks,
              evaluationCriteria: subQuestion.evaluationCriteria,
              hint: subQuestion.hint,
              imagePath: question.imagePath,
            });
          });
        } else if (part.maxMarks) {
          const partAnswerId = `${part.id}-answer`;
          submissions.push({
            questionId: partAnswerId,
            answer: debouncedAnswers.value[partAnswerId] || "",
          });

          questionsForChecking.push({
            id: partAnswerId,
            question: [part.partLabel, part.questionText].filter(Boolean).join(" "),
            context: {
              mainQuestion: `${question.questionNumber} ${question.questionText || ""}`.trim(),
            },
            acceptedAnswers: part.acceptedAnswers || [],
            questionType: part.useAI !== false ? "reasoning" : "exact",
            maxMarks: part.maxMarks,
            hint: part.hint,
            imagePath: question.imagePath,
          });
        }
      });
    });

    const results = await answerChecker.checkAnswersBatch(submissions, questionsForChecking);
    const score = results.reduce((sum, result) => sum + result.result.marksAwarded, 0);

    const detailedAnswers: QuestionAnswer[] = [];

    props.questions.questions.forEach((question) => {
      if (question.maxMarks) {
        const questionAnswerId = `${question.id}-answer`;
        const result = results.find((item) => item.questionId === questionAnswerId);

        detailedAnswers.push({
          questionId: questionAnswerId,
          userAnswer: debouncedAnswers.value[questionAnswerId] || "",
          aiFeedback: result?.result.feedback || "",
          correctAnswer: question.acceptedAnswers?.length
            ? question.acceptedAnswers.join(", ")
            : question.hint || "",
          isCorrect: result?.result.isCorrect || false,
          question: `${question.questionNumber} ${question.questionText || ""}`.trim(),
          options: [],
        });
      }

      question.parts.forEach((part) => {
        if (part.maxMarks) {
          const partAnswerId = `${part.id}-answer`;
          const result = results.find((item) => item.questionId === partAnswerId);

          detailedAnswers.push({
            questionId: partAnswerId,
            userAnswer: debouncedAnswers.value[partAnswerId] || "",
            aiFeedback: result?.result.feedback || "",
            correctAnswer: part.acceptedAnswers?.length ? part.acceptedAnswers.join(", ") : part.hint || "",
            isCorrect: result?.result.isCorrect || false,
            question: `${question.questionNumber} ${part.partLabel} ${part.questionText || ""}`.trim(),
            options: [],
          });
        }

        part.subQuestions.forEach((subQuestion) => {
          const result = results.find((item) => item.questionId === subQuestion.id);

          detailedAnswers.push({
            questionId: subQuestion.id,
            userAnswer: debouncedAnswers.value[subQuestion.id] || "",
            aiFeedback: result?.result.feedback || "",
            correctAnswer: subQuestion.acceptedAnswers?.length
              ? subQuestion.acceptedAnswers.join(", ")
              : subQuestion.hint || "",
            isCorrect: result?.result.isCorrect || false,
            question: `${question.questionNumber} ${part.partLabel} ${subQuestion.subLabel} ${subQuestion.questionText}`.trim(),
            options: [],
          });
        });
      });
    });

    return { score, answers: detailedAnswers };
  } finally {
    isCalculatingScore.value = false;
  }
};

watch(debouncedAnsweredCount, (value) => {
  props.onStateUpdate?.(totalQuestions.value, value);
});

watch(
  [debouncedAnswers, collectAnswers],
  async () => {
    if (!collectAnswers.value) return;

    const { score, answers: detailedAnswers } = await calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
      answers: detailedAnswers,
      questions: props.questions.questions,
    });
  },
  { deep: true },
);
</script>

<template>
  <section
    class="flex h-full flex-col rounded-b-xl bg-white shadow-sm"
    aria-labelledby="exam-open-ended-title"
    :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
    :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '18px' }"
  >
    <h2 id="exam-open-ended-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila swali na sehemu ya kuandika jibu. Andika majibu yako katika nafasi zilizotolewa."
          : "Use Tab to move through each question and answer field. Type your responses in the spaces provided."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>
    <div class="flex-1 overflow-y-auto p-2 md:p-6">
      <div class="space-y-8" role="list" :aria-label="ui.question.value">
        <div
          v-for="(question, questionIndex) in props.questions.questions"
          :key="question.id"
          class="rounded-lg border bg-neutral-50 p-2 focus-within:ring-2 focus-within:ring-picton-blue-400 md:p-6"
          role="listitem"
          :aria-labelledby="`exam-open-ended-question-${question.id}`"
        >
          <div
            :class="
              cn('mb-6', {
                flex: !question.questionText && !question.maxMarks && !question.imagePath,
              })
            "
          >
            <div class="mb-4">
              <h4
                v-if="Number.parseInt(question.questionNumber, 10) < 100"
                :id="`exam-open-ended-question-${question.id}`"
                class="mr-2 inline font-bold"
              >
                {{ question.questionNumber }}
              </h4>
              <p
                v-if="question.questionText?.trim()"
                class="inline whitespace-pre-line"
                v-html="question.questionText"
              />
            </div>

            <div v-if="question.imagePath" class="mb-4">
              <ImageModal
                :src="question.imagePath"
                :alt="ui.isSwahili ? `Picha ya swali ${question.questionNumber}` : `Question ${question.questionNumber} image`"
                class="h-auto w-full max-w-md cursor-pointer rounded-lg border border-neutral-200 shadow-sm transition-opacity hover:opacity-80"
              />
            </div>

            <div v-if="question.maxMarks" class="mb-4">
              <div class="relative">
                <Textarea
                  :model-value="answerValue(`${question.id}-answer`)"
                  class="min-h-[40px] bg-white focus:border-picton-blue-500"
                  :aria-label="ui.isSwahili ? `Jibu la swali ${question.questionNumber}` : `Answer for question ${question.questionNumber}`"
                  :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                  :class="
                    cn({
                      'border-picton-blue-400 bg-picton-blue-50/30':
                        answerValue(`${question.id}-answer`).trim() !== '',
                    })
                  "
                  @update:model-value="(value) => handleInputChange(`${question.id}-answer`, value)"
                />
                <div class="absolute right-2 top-2">
                  <div
                    :class="
                      cn(
                        'h-3 w-3 rounded-full',
                        answerValue(`${question.id}-answer`).trim() !== ''
                          ? 'bg-green-500'
                          : 'bg-neutral-300',
                      )
                    "
                  />
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div v-for="part in question.parts" :key="part.id" class="md:ml-4">
                <div class="mb-4">
                  <h5 v-if="part.partLabel" class="mr-2 inline font-semibold">
                    {{ part.partLabel }}
                  </h5>
                  <p
                    v-if="part.questionText?.trim()"
                    class="inline whitespace-pre-line"
                    v-html="part.questionText"
                  />
                </div>

                <div v-if="part.maxMarks" class="mb-4 md:ml-4">
                  <div class="relative">
                    <Textarea
                      :model-value="answerValue(`${part.id}-answer`)"
                      class="min-h-[40px] bg-white focus:border-picton-blue-500"
                      :aria-label="ui.isSwahili ? `Jibu la sehemu ${part.partLabel}` : `Answer for part ${part.partLabel}`"
                      :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                      :class="
                        cn({
                          'border-picton-blue-400 bg-picton-blue-50/30':
                            answerValue(`${part.id}-answer`).trim() !== '',
                        })
                      "
                      @update:model-value="(value) => handleInputChange(`${part.id}-answer`, value)"
                    />
                    <div class="absolute right-2 top-2">
                      <div
                        :class="
                          cn(
                            'h-3 w-3 rounded-full',
                            answerValue(`${part.id}-answer`).trim() !== ''
                              ? 'bg-green-500'
                              : 'bg-neutral-300',
                          )
                        "
                      />
                    </div>
                  </div>
                </div>

                <div :class="cn('space-y-4 md:ml-4', { 'mt-4': part.maxMarks })">
                  <div v-for="subQuestion in part.subQuestions" :key="subQuestion.id" class="space-y-2">
                    <div>
                      <h4 v-if="subQuestion.subLabel" class="mr-2 inline font-medium">
                        {{ subQuestion.subLabel }}
                      </h4>
                      <p
                        v-if="subQuestion.questionText?.trim()"
                        class="inline whitespace-pre-line"
                        v-html="subQuestion.questionText"
                      />

                      <div class="mt-2">
                        <div class="relative">
                          <Textarea
                            :model-value="answerValue(subQuestion.id)"
                            class="min-h-[40px] bg-white focus:border-picton-blue-500"
                            :aria-label="ui.isSwahili ? `Jibu la ${subQuestion.subLabel}` : `Answer for ${subQuestion.subLabel}`"
                            :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                            :class="
                              cn({
                                'border-picton-blue-400 bg-picton-blue-50/30':
                                  answerValue(subQuestion.id).trim() !== '',
                              })
                            "
                            @update:model-value="(value) => handleInputChange(subQuestion.id, value)"
                          />
                          <div class="absolute right-2 top-2">
                            <div
                              :class="
                                cn(
                                  'h-3 w-3 rounded-full',
                                  answerValue(subQuestion.id).trim() !== ''
                                    ? 'bg-green-500'
                                    : 'bg-neutral-300',
                                )
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
        </div>
      </div>
    </div>
  </section>
</template>
