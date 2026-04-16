<script setup lang="ts">
import { cn } from "~/utilities/utils";
import ActivityResults from "~/components/templates/results";
import type { ShapeQuestion } from "./types";

type ResultsSummaryProps = {
  questions: ShapeQuestion[];
  score: number;
  answers: { [key: number]: string };
  feedbacks: { [key: number]: boolean };
  resultCanvasRefs: { current: (HTMLCanvasElement | null)[] };
  onRestart: () => void;
};

const props = defineProps<ResultsSummaryProps>();
const ui = useActivityUiText();
</script>

<template>
  <section
    class="flex-1 flex flex-col items-center justify-between p-4 overflow-auto"
    aria-labelledby="shapes-results-summary-title"
  >
    <h2 id="shapes-results-summary-title" class="sr-only">
      {{ ui.isSwahili ? "Muhtasari wa matokeo ya maumbo" : "Shapes results summary" }}
    </h2>
    <div class="w-full space-y-4">
      <div
        v-for="(question, idx) in props.questions"
        :key="question.id"
        :class="
          cn(
            'p-4 rounded-md border',
            (props.answers[idx] || '').toLowerCase() === question.answer.toLowerCase()
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50',
          )
        "
        :aria-labelledby="`shapes-results-question-${question.id}`"
      >
        <div class="flex items-center justify-between mb-2">
          <p :id="`shapes-results-question-${question.id}`" class="font-medium text-lg">{{ ui.formatQuestion(idx + 1) }}</p>
          <div
            :class="
              cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                (props.answers[idx] || '').toLowerCase() === question.answer.toLowerCase()
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700',
              )
            "
          >
            <span
              v-if="
                (props.answers[idx] || '').toLowerCase() ===
                question.answer.toLowerCase()
              "
              class="text-lg font-bold leading-none"
              aria-label="correct"
            >
              ✓
            </span>
            <span v-else class="text-lg font-bold leading-none" aria-label="incorrect">✕</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div>
            <p class="text-sm font-medium mb-1 text-gray-500">{{ ui.correctShape }}</p>
            <div class="flex flex-col items-center">
              <canvas
                :ref="
                  (el) => {
                    props.resultCanvasRefs.current[idx] = (el as HTMLCanvasElement) || null;
                  }
                "
                width="200"
                height="200"
                class="border border-green-300 rounded-md bg-white"
                role="img"
                :aria-label="question.shape.label || question.answer"
              />
              <span class="mt-2 font-medium text-green-700">
                {{ question.answer }}
              </span>
            </div>
          </div>

          <div
            v-if="
              (props.answers[idx] || '').toLowerCase() !== question.answer.toLowerCase() &&
              (props.answers[idx] || '')
            "
          >
            <p class="text-sm font-medium mb-1 text-gray-500">{{ ui.yourAnswer }}</p>
            <div class="flex flex-col items-center">
              <div class="border border-red-300 rounded-md h-[200px] w-[200px] flex items-center justify-center bg-white">
                <span class="font-medium text-red-700 text-lg">
                  {{ props.answers[idx] }}
                </span>
              </div>
              <span class="mt-2 font-medium text-red-700">
                {{ props.answers[idx] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full mt-4">
      <ActivityResults
        :score="props.score"
        :total="props.questions.length"
        :onRestart="props.onRestart"
      />
    </div>
  </section>
</template>
