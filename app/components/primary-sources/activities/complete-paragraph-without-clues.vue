<script setup lang="ts">
import { Fragment, computed, ref, watch } from "vue";
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
import { Icon } from "@iconify/vue";

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    paragraph: string;
    image?: string;
    answers: string[];
    options?: string[];
    withClues: boolean;
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const userAnswers = ref<string[]>([]);
const isCorrectAnswers = ref<boolean[]>([]);
const instructionsId = "complete-paragraph-without-clues-instructions";
const statusId = "complete-paragraph-without-clues-status";
const keyboardStatusMessage = ref("");

const initialize = () => {
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  userAnswers.value = Array.from({ length: props.questions?.answers?.length }, () => "");
  isCorrectAnswers.value = Array.from({ length: props?.questions?.answers?.length }, () => false);
  keyboardStatusMessage.value = "";
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

const allAnswersFilled = computed(() => userAnswers.value.every((answer) => answer.trim() !== ""));
const paragraphParts = computed(() => props.questions?.paragraph?.split("___")??[]);
const getPartTokens = (part: string) => part.split(/(\s+)/).filter((token) => token.length > 0);

const checkAnswers = () => {
  const correctness = userAnswers.value.map((answer, index) =>
    answerChecker.checkAnswer(answer.trim().toLowerCase(), {
      acceptedAnswers: [props.questions.answers[index]?.trim().toLowerCase() ?? ""],
    }).isCorrect,
  );

  score.value = correctness.reduce((total, value) => total + (value ? 1 : 0), 0);
  isCorrectAnswers.value = correctness;
  allAnswered.value = true;
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${props.questions.answers.length}.`;
  playSound(score.value === props.questions.answers.length ? "success" : "failure");
};

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Complete the paragraph by filling in the missing words. Use the Tab key to move between the
      blanks, then activate the check answers button when all blanks are filled.
    </p>
    <p :id="statusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
    </p>

    <template v-if="showResults">
      <div
        class="flex h-full w-full flex-col justify-between overflow-auto rounded-xl bg-picton-blue-50 p-4"
        :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '18px' }"
      >
        <div class="p-4 leading-loose">
          <template v-for="(part, index) in paragraphParts" :key="index">
            <span>{{ part }}</span>
            <span v-if="index < paragraphParts.length - 1" class="mx-1">
              <template v-if="props.feedback === 'wrong-correct-answers'">
                <span
                  v-if="userAnswers[index]"
                  :class="
                    cn(
                      'rounded px-2 py-1 font-medium',
                      isCorrectAnswers[index]
                        ? 'bg-green-200 text-green-800'
                        : 'mr-1 bg-red-200 text-red-800 line-through',
                    )
                  "
                >
                  {{ userAnswers[index] }}
                </span>
                <span
                  v-if="!userAnswers[index] || !isCorrectAnswers[index]"
                  class="rounded bg-green-200 px-2 py-1 font-medium text-green-800"
                >
                  {{ props.questions.answers[index] }}
                </span>
              </template>
              <span
                v-else
                :class="
                  cn(
                    'rounded px-2 py-1 font-medium',
                    isCorrectAnswers[index]
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800',
                  )
                "
              >
                {{ userAnswers[index] || "_____" }}
              </span>
            </span>
          </template>
        </div>
      </div>

      <div class="mt-4 w-full">
        <ActivityResults
          :score="score"
          :total="props.questions.answers.length"
          :onRestart="resetActivity"
        />
      </div>
    </template>

    <div
      v-else
      class="flex h-full flex-col gap-4"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '18px' }"
    >
      <div class="flex h-full flex-col gap-4 md:flex-row">
        <div class="flex h-full w-full flex-col gap-4 overflow-auto rounded-xl bg-picton-blue-50 p-6">
          <div
            v-if="props.questions.withClues"
            class="flex w-fit flex-wrap gap-4 rounded border-2 border-picton-blue-300 bg-picton-blue-100 py-4"
            :aria-describedby="instructionsId"
          >
            <p
              v-for="(answer, index) in props.questions.options || []"
              :key="index"
              class="px-3 text-lg leading-4 text-picton-blue-700"
            >
              {{ answer }}
            </p>
          </div>

          <div class="leading-loose">
            <template v-for="(part, index) in paragraphParts" :key="index">
              <span class="whitespace-pre-wrap">
                <template v-for="(word, wordIndex) in getPartTokens(part)" :key="wordIndex">
                  <span
                    :class="word.startsWith('_') ? 'rounded bg-yellow-100 p-1 text-lemon-700' : ''"
                  >
                    {{ word.startsWith("_") ? word.slice(1) : word }}
                  </span>
                </template>
              </span>
              <span v-if="index < paragraphParts.length - 1" class="mx-2 inline-block align-middle">
                <Input
                  :model-value="userAnswers[index]"
                  type="text"
                  :aria-label="`Blank ${index + 1} in paragraph`"
                  :aria-describedby="`${instructionsId} ${statusId}`"
                  class="max-w-40 rounded-none border-none bg-transparent text-center !text-lg text-picton-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                  :disabled="showResults"
                  @update:model-value="
                    (value) => {
                      const nextAnswers = [...userAnswers];
                      nextAnswers[index] = String(value ?? '');
                      userAnswers = nextAnswers;
                      keyboardStatusMessage = ui.formatActivityUpdated(ui.formatQuestion(index + 1), String(value ?? ''));
                    }
                  "
                />
                <div class="border-b border-dashed border-picton-blue-700" />
              </span>
            </template>
          </div>
        </div>

        <div
          v-if="props.questions.image"
          class="flex items-center justify-center rounded-xl bg-white p-4 md:w-1/2"
        >
          <img
            :src="props.questions.image"
            :alt="props.questions.title"
            class="max-h-[600px] w-full object-contain"
          >
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          :disabled="!allAnswersFilled"
          :aria-describedby="`${instructionsId} ${statusId}`"
          @click="checkAnswers"
          class="group gap-2 px-6 py-2"
        >
          <Icon
            icon="heroicons:sparkles"
            width="18"
            height="18"
            class="text-lemon-600 transition-transform duration-200 group-hover:scale-110 animate-pulse"
          />
          {{ ui.checkAnswers }}
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions?.answers?.length ?? 0"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
            allAnswered = false;
          }
        }
      "
    />
  </div>
</template>
