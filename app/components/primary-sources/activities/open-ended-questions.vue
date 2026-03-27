<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "~/composables/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { ImageModal } from "@/components/ui/image-modal";

type OpenEndedSubQuestion = {
  id: string;
  subLabel: string;
  questionText?: string;
  maxMarks: number;
  useAI?: boolean;
  hint?: string;
  acceptedAnswers?: string[];
  evaluationCriteria?: string;
};

type OpenEndedPart = {
  id: string;
  partLabel: string;
  questionText?: string;
  maxMarks?: number;
  useAI?: boolean;
  hint?: string;
  acceptedAnswers?: string[];
  subQuestions: OpenEndedSubQuestion[];
};

type OpenEndedQuestion = {
  id: string;
  questionNumber: string;
  questionText?: string;
  imagePath?: string;
  useAI?: boolean;
  hint?: string;
  acceptedAnswers?: string[];
  maxMarks?: number;
  parts: OpenEndedPart[];
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    questions: OpenEndedQuestion[];
  };
  feedback?: FeedbackType;
};

type ScoredAnswer = {
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks?: number;
  feedback: string;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct",
});

const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const answers = ref<Record<string, string>>({});
const isCalculatingScore = ref(false);
const allAnswered = ref(false);
const showResults = ref(false);
const finalScore = ref(0);
const aiResults = ref<Record<string, ScoredAnswer>>({});

const totalMarks = computed(() =>
  props.questions.questions.reduce(
    (total, question) =>
      total +
      (question.maxMarks || 0) +
      question.parts.reduce(
        (partTotal, part) =>
          partTotal +
          (part.maxMarks || 0) +
          part.subQuestions.reduce((sum, subQuestion) => sum + (subQuestion.maxMarks || 0), 0),
        0,
      ),
    0,
  ),
);

const normalizedAnswer = (answerId: string) => answers.value[answerId] || "";

const handleInputChange = (questionId: string, value: string | number) => {
  answers.value = {
    ...answers.value,
    [questionId]: String(value ?? ""),
  };
};

const getAcceptedAnswerText = (acceptedAnswers?: string[], hint?: string) =>
  acceptedAnswers?.filter(Boolean).join(", ") || hint || "No accepted answer configured.";

const calculateScore = async () => {
  if (isCalculatingScore.value || !Object.keys(answers.value).length) {
    return { score: 0 };
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
      context?: Record<string, unknown>;
      evaluationCriteria?: string;
      imagePath?: string;
    }[] = [];

    props.questions.questions.forEach((question) => {
      if (question.maxMarks) {
        const questionAnswerId = `${question.id}-answer`;
        submissions.push({
          questionId: questionAnswerId,
          answer: normalizedAnswer(questionAnswerId),
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
        if (part.maxMarks) {
          const partAnswerId = `${part.id}-answer`;
          submissions.push({
            questionId: partAnswerId,
            answer: normalizedAnswer(partAnswerId),
          });

          questionsForChecking.push({
            id: partAnswerId,
            question: [part.partLabel, part.questionText].filter(Boolean).join(" "),
            acceptedAnswers: part.acceptedAnswers || [],
            questionType: part.useAI !== false ? "reasoning" : "exact",
            maxMarks: part.maxMarks,
            hint: part.hint,
            imagePath: question.imagePath,
            context: {
              mainQuestion: `${question.questionNumber} ${question.questionText || ""}`.trim(),
            },
          });
        }

        part.subQuestions.forEach((subQuestion) => {
          submissions.push({
            questionId: subQuestion.id,
            answer: normalizedAnswer(subQuestion.id),
          });

          questionsForChecking.push({
            id: subQuestion.id,
            question: [
              question.questionNumber,
              part.partLabel,
              subQuestion.subLabel,
              subQuestion.questionText || part.questionText || question.questionText,
            ]
              .filter(Boolean)
              .join(" "),
            acceptedAnswers: subQuestion.acceptedAnswers || [],
            questionType: subQuestion.useAI !== false ? "reasoning" : "exact",
            maxMarks: subQuestion.maxMarks,
            hint: subQuestion.hint,
            imagePath: question.imagePath,
            evaluationCriteria: subQuestion.evaluationCriteria,
            context: {
              mainQuestion: `${question.questionNumber} ${question.questionText || ""}`.trim(),
              partQuestion: `${part.partLabel} ${part.questionText || ""}`.trim(),
            },
          });
        });
      });
    });

    const results = await answerChecker.checkAnswersBatch(submissions, questionsForChecking);
    aiResults.value = results.reduce((acc, result) => {
      acc[result.questionId] = {
        ...result.result,
        maxMarks: questionsForChecking.find((item) => item.id === result.questionId)?.maxMarks,
      };
      return acc;
    }, {} as Record<string, ScoredAnswer>);

    return {
      score: results.reduce((sum, result) => sum + result.result.marksAwarded, 0),
    };
  } finally {
    isCalculatingScore.value = false;
  }
};

const handleSubmit = async () => {
  if (isCalculatingScore.value) return;

  const { score } = await calculateScore();
  finalScore.value = score;
  allAnswered.value = true;

  const percentage = totalMarks.value > 0 ? (score / totalMarks.value) * 100 : 0;
  playSound(percentage >= 70 ? "correct" : "failure");
};

const resetActivity = () => {
  answers.value = {};
  aiResults.value = {};
  finalScore.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  isCalculatingScore.value = false;
};

const getQuestionResult = (questionId: string) => aiResults.value[questionId];

const resultCardClass = (isCorrect?: boolean) =>
  isCorrect
    ? "border-green-300 bg-green-50"
    : "border-red-300 bg-red-50";
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="isCalculatingScore"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/35"
    >
      <div class="rounded-2xl bg-white px-6 py-4 text-center shadow-xl">
        <p class="text-lg font-semibold text-oceanBlue">Checking answers...</p>
      </div>
    </div>

    <div v-if="showResults" class="flex flex-1 flex-col gap-4 overflow-auto pb-4">
      <div class="space-y-4">
        <div
          v-for="question in props.questions.questions"
          :key="question.id"
          class="rounded-2xl border border-oceanBlue/10 bg-neutral-50 p-4 md:p-6"
        >
          <div class="space-y-4">
            <div>
              <h4 class="inline font-bold text-neutral-800">{{ question.questionNumber }}</h4>
              <span
                v-if="question.questionText"
                class="ml-2 whitespace-pre-line text-neutral-700"
                v-html="question.questionText"
              />
            </div>

            <ImageModal
              v-if="question.imagePath"
              :src="question.imagePath"
              :alt="`Question ${question.questionNumber} image`"
              class="max-w-md rounded-xl border border-oceanBlue/10"
            />

            <div
              v-if="question.maxMarks"
              :class="cn('rounded-xl border p-3', resultCardClass(getQuestionResult(`${question.id}-answer`)?.isCorrect))"
            >
              <p class="text-sm font-medium text-neutral-700">Your answer</p>
              <p class="mt-1 whitespace-pre-line text-sm text-neutral-700">
                {{ normalizedAnswer(`${question.id}-answer`) || "No answer provided." }}
              </p>
              <p
                v-if="props.feedback === 'wrong-correct-answers'"
                class="mt-2 text-sm text-green-700"
              >
                Correct answer:
                {{ getAcceptedAnswerText(question.acceptedAnswers, question.hint) }}
              </p>
            </div>

            <div class="space-y-4">
              <div
                v-for="part in question.parts"
                :key="part.id"
                class="space-y-3 md:ml-4"
              >
                <div>
                  <span class="font-semibold text-neutral-800">{{ part.partLabel }}</span>
                  <span
                    v-if="part.questionText"
                    class="ml-2 whitespace-pre-line text-neutral-700"
                    v-html="part.questionText"
                  />
                </div>

                <div
                  v-if="part.maxMarks"
                  :class="cn('rounded-xl border p-3 md:ml-4', resultCardClass(getQuestionResult(`${part.id}-answer`)?.isCorrect))"
                >
                  <p class="text-sm font-medium text-neutral-700">Your answer</p>
                  <p class="mt-1 whitespace-pre-line text-sm text-neutral-700">
                    {{ normalizedAnswer(`${part.id}-answer`) || "No answer provided." }}
                  </p>
                  <p
                    v-if="props.feedback === 'wrong-correct-answers'"
                    class="mt-2 text-sm text-green-700"
                  >
                    Correct answer:
                    {{ getAcceptedAnswerText(part.acceptedAnswers, part.hint) }}
                  </p>
                </div>

                <div class="space-y-3 md:ml-4">
                  <div
                    v-for="subQuestion in part.subQuestions"
                    :key="subQuestion.id"
                    :class="cn('rounded-xl border p-3', resultCardClass(getQuestionResult(subQuestion.id)?.isCorrect))"
                  >
                    <p class="text-sm font-medium text-neutral-800">
                      {{ subQuestion.subLabel }}
                      <span
                        v-if="subQuestion.questionText"
                        class="ml-2 whitespace-pre-line font-normal text-neutral-700"
                        v-html="subQuestion.questionText"
                      />
                    </p>
                    <p class="mt-2 text-sm font-medium text-neutral-700">Your answer</p>
                    <p class="mt-1 whitespace-pre-line text-sm text-neutral-700">
                      {{ normalizedAnswer(subQuestion.id) || "No answer provided." }}
                    </p>
                    <p
                      v-if="props.feedback === 'wrong-correct-answers'"
                      class="mt-2 text-sm text-green-700"
                    >
                      Correct answer:
                      {{ getAcceptedAnswerText(subQuestion.acceptedAnswers, subQuestion.hint) }}
                    </p>
                    <p
                      v-if="getQuestionResult(subQuestion.id)?.feedback"
                      class="mt-2 text-sm text-oceanBlue"
                    >
                      {{ getQuestionResult(subQuestion.id)?.feedback }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults :score="finalScore" :total="totalMarks" :on-restart="resetActivity" />
    </div>

    <div v-else class="flex flex-1 flex-col gap-4 overflow-auto pb-4">
      <div class="space-y-4">
        <div
          v-for="question in props.questions.questions"
          :key="question.id"
          class="rounded-2xl border border-oceanBlue/10 bg-neutral-50 p-4 md:p-6"
        >
          <div class="space-y-4">
            <div>
              <h4 class="inline font-bold text-neutral-800">{{ question.questionNumber }}</h4>
              <span
                v-if="question.questionText"
                class="ml-2 whitespace-pre-line text-neutral-700"
                v-html="question.questionText"
              />
            </div>

            <ImageModal
              v-if="question.imagePath"
              :src="question.imagePath"
              :alt="`Question ${question.questionNumber} image`"
              class="max-w-md rounded-xl border border-oceanBlue/10"
            />

            <Textarea
              v-if="question.maxMarks"
              :model-value="normalizedAnswer(`${question.id}-answer`)"
              class="min-h-[80px] bg-white"
              placeholder="Type your answer"
              @update:model-value="(value) => handleInputChange(`${question.id}-answer`, value)"
            />

            <div class="space-y-4">
              <div
                v-for="part in question.parts"
                :key="part.id"
                class="space-y-3 md:ml-4"
              >
                <div>
                  <span class="font-semibold text-neutral-800">{{ part.partLabel }}</span>
                  <span
                    v-if="part.questionText"
                    class="ml-2 whitespace-pre-line text-neutral-700"
                    v-html="part.questionText"
                  />
                </div>

                <Textarea
                  v-if="part.maxMarks"
                  :model-value="normalizedAnswer(`${part.id}-answer`)"
                  class="min-h-[80px] bg-white md:ml-4"
                  placeholder="Type your answer"
                  @update:model-value="(value) => handleInputChange(`${part.id}-answer`, value)"
                />

                <div class="space-y-3 md:ml-4">
                  <div
                    v-for="subQuestion in part.subQuestions"
                    :key="subQuestion.id"
                    class="space-y-2"
                  >
                    <p class="text-sm font-medium text-neutral-800">
                      {{ subQuestion.subLabel }}
                      <span
                        v-if="subQuestion.questionText"
                        class="ml-2 whitespace-pre-line font-normal text-neutral-700"
                        v-html="subQuestion.questionText"
                      />
                    </p>
                    <Textarea
                      :model-value="normalizedAnswer(subQuestion.id)"
                      class="min-h-[72px] bg-white"
                      placeholder="Type your answer"
                      @update:model-value="(value) => handleInputChange(subQuestion.id, value)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 flex justify-end bg-white/85 py-3 backdrop-blur">
        <Button :disabled="isCalculatingScore || !Object.keys(answers).length" @click="handleSubmit">
          {{ isCalculatingScore ? "Checking..." : "Check Answers" }}
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="finalScore"
      :total="totalMarks"
      :open="allAnswered"
      :on-open-change="
        (open) => {
          if (open) {
            return;
          }
          allAnswered = false;
          if (props.feedback === 'none') {
            resetActivity();
          } else {
            showResults = true;
          }
        }
      "
    />
  </div>
</template>
