<script setup lang="ts">
import { computed, ref } from "vue";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "~/composables/use-sound-effects";

type DiagramQuestions = {
  notes: string;
  title: string;
  image: string;
  variant?: "input" | "checkbox";
  questions: {
    question: string;
    title?: string;
    answers: string[];
  }[];
};

type Props = {
  questions: DiagramQuestions;
  feedback?: FeedbackType;
};

const props = defineProps<Props>();
const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const answersChecked = ref(false);
const correctAnswers = ref<boolean[]>([]);
const typedAnswers = ref<string[]>([]);
const checkboxAnswers = ref<boolean[]>([]);

const isCheckboxVariant = computed(() => props.questions.variant === "checkbox");

const groupedQuestions = computed(() => {
  const grouped: {
    title: string | null;
    questions: { question: DiagramQuestions["questions"][number]; originalIndex: number }[];
  }[] = [];

  props.questions.questions.forEach((question, index) => {
    const title = question.title || null;
    let group = grouped.find((item) => item.title === title);
    if (!group) {
      group = { title, questions: [] };
      grouped.push(group);
    }
    group.questions.push({ question, originalIndex: index });
  });

  return grouped;
});

const areAllRequiredInputsFilled = computed(() => {
  if (isCheckboxVariant.value) return true;

  return props.questions.questions.every(
    (question, index) => !question.question.includes("___") || !!typedAnswers.value[index],
  );
});

const handleCheckAnswer = () => {
  const nextCorrectAnswers = props.questions.questions.map((question, index) => {
    if (isCheckboxVariant.value) {
      return !!checkboxAnswers.value[index] === (question.answers[0].toUpperCase() === "T");
    }

    return answerChecker.checkAnswer(typedAnswers.value[index] || "", {
      strictMode: true,
      acceptedAnswers: question.answers,
    }).isCorrect;
  });

  score.value = nextCorrectAnswers.filter(Boolean).length;
  correctAnswers.value = nextCorrectAnswers;
  answersChecked.value = true;
  allAnswered.value = true;
  playSound("success");
};

const resetActivity = () => {
  typedAnswers.value = Array.from({ length: props.questions.questions.length }, () => "");
  checkboxAnswers.value = Array.from({ length: props.questions.questions.length }, () => false);
  score.value = 0;
  allAnswered.value = false;
  correctAnswers.value = [];
  answersChecked.value = false;
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex h-full flex-col gap-4">
      <div class="grid h-full gap-4 md:grid-cols-2">
        <div class="flex h-full w-full flex-col justify-between gap-4 overflow-y-auto rounded-xl bg-white p-2 md:h-[calc(100dvh-200px)] md:p-6">
          <div :class="props.questions.image ? 'md:max-h-[300px] md:overflow-auto' : ''">
            <p
              class="h-full whitespace-pre-line text-lg tracking-wide text-picton-blue-700"
              v-html="props.questions.notes"
            />
          </div>

          <div v-if="props.questions.image" class="h-3/4 rounded-xl p-1">
            <img
              :src="props.questions.image"
              alt="Matching Items"
              class="mx-auto h-full object-contain"
            >
          </div>
        </div>

        <div class="flex w-full justify-between gap-4 rounded-xl bg-white p-4 text-lg md:p-6">
          <div
            v-for="(group, groupIndex) in groupedQuestions"
            :key="groupIndex"
            class="flex flex-col gap-2"
          >
            <h3 v-if="group.title" class="mb-2 text-xl font-bold text-picton-blue-800">
              {{ group.title }}
            </h3>

            <div
              v-for="({ question, originalIndex }) in group.questions"
              :key="originalIndex"
              class="gap-2"
            >
              <div v-if="isCheckboxVariant" class="flex items-center gap-3 py-2">
                <Checkbox
                  :checked="checkboxAnswers[originalIndex]"
                  :disabled="answersChecked"
                  :class="
                    cn('h-5 w-5', {
                      'border-green-500': answersChecked && correctAnswers[originalIndex],
                      'border-red-500': answersChecked && !correctAnswers[originalIndex],
                    })
                  "
                  @update:checked="
                    (checked) => {
                      const nextAnswers = [...checkboxAnswers];
                      nextAnswers[originalIndex] = checked === true;
                      checkboxAnswers = nextAnswers;
                    }
                  "
                />
                <span class="text-picton-blue-800">{{ question.question }}</span>
                <span v-if="answersChecked" :class="correctAnswers[originalIndex] ? 'ml-2 shrink-0 text-green-500' : 'ml-2 text-red-500'">
                  {{ correctAnswers[originalIndex] ? "✓" : "✕" }}
                </span>
              </div>

              <div v-else>
                <template v-if="question.question.split('___').length > 1">
                  <span>{{ question.question.split("___")[0] }}</span>
                  <span class="mx-2 inline-flex items-center gap-2 align-middle">
                    <div class="relative">
                      <Input
                        type="text"
                        :model-value="typedAnswers[originalIndex] || ''"
                        :readonly="answersChecked"
                        :class="
                          cn(
                            'max-w-48 rounded-none border-none bg-transparent text-center !text-lg text-picton-blue-700',
                            answersChecked && correctAnswers[originalIndex] && 'bg-green-50',
                            answersChecked && !correctAnswers[originalIndex] && 'bg-red-50',
                          )
                        "
                        @update:model-value="
                          (value) => {
                            const nextAnswers = [...typedAnswers];
                            nextAnswers[originalIndex] = String(value ?? '');
                            typedAnswers = nextAnswers;
                          }
                        "
                      />
                      <div class="border-b border-dashed border-picton-blue-700" />
                    </div>

                    <span v-if="answersChecked">
                      <span v-if="correctAnswers[originalIndex]" class="text-green-500">✓</span>
                      <span v-else class="flex items-center gap-2">
                        <span class="text-red-500">✕</span>
                        <span
                          v-if="props.feedback === 'wrong-correct-answers'"
                          class="text-sm font-medium text-green-600"
                        >
                          {{ question.answers[0] }}
                        </span>
                      </span>
                    </span>
                  </span>
                  {{ question.question.split("___")[1] }}
                </template>

                <span v-else>{{ question.question }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults
        v-if="answersChecked"
        :score="score"
        :total="props.questions.questions.length"
        :onRestart="resetActivity"
      />

      <div v-else class="flex items-center justify-end gap-4">
        <Button :disabled="!areAllRequiredInputsFilled || answersChecked" @click="handleCheckAnswer">
          Check Answer
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            allAnswered = false;
          }
        }
      "
    />
  </div>
</template>
