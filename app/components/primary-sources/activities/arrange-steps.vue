<script setup lang="ts">
import { ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Step = {
  id: string;
  text: string;
  image?: string;
};

type Props = {
  questions: {
    title: string;
    notes: string;
    notesImage?: string;
    steps: Step[];
  };
  feedback?: FeedbackType;
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct-answers",
});

const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const steps = ref<Step[]>([]);
const arrangedSteps = ref<Array<Step | "">>([]);

const initializeActivity = () => {
  steps.value = shuffle([...props.questions.steps]);
  arrangedSteps.value = Array.from({ length: props.questions.steps.length }, () => "");
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
};

watch(() => props.questions, initializeActivity, { deep: true, immediate: true });

watch(arrangedSteps, (value) => {
  if (!value.every((step) => step !== "")) {
    allAnswered.value = false;
    return;
  }

  score.value = value.reduce(
    (total, step, index) => total + (step !== "" && step.id === props.questions.steps[index].id ? 1 : 0),
    0,
  );
  playSound("success");
  allAnswered.value = true;
}, { deep: true });

const handleDragEnd = (event: DragEndEvent) => {
  const activeValue = String(event.active?.id || "");
  const overValue = String(event.over?.id || "");
  if (!activeValue || !overValue) return;

  const [activeId, activeIndex = ""] = activeValue.split("%");
  const overIndex = Number(overValue.split("%")[1]);
  const activeStep = props.questions.steps.find((step) => step.id === activeId);
  if (!activeStep) return;

  const nextSteps = [...arrangedSteps.value];
  nextSteps[overIndex] = activeStep;

  if (activeIndex) {
    nextSteps[Number(activeIndex)] = "";
  }

  arrangedSteps.value = nextSteps;
  steps.value = steps.value.filter((step) => step.id !== activeId);
  playSound("click");
};

const resetActivity = () => {
  initializeActivity();
};

const isCorrect = (step: Step, index: number) =>
  showResults.value && step.id === props.questions.steps[index].id;
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex flex-col gap-4">
      <DNDContext :onDragEnd="handleDragEnd">
        <div class="flex gap-6">
          <div class="w-1/2">
            <LeftNotesWithImages :notes="props.questions.notes" :image="props.questions.notesImage" />
          </div>

          <div class="w-1/2">
            <div class="relative flex h-[600px] flex-col gap-3">
              <div
                v-for="(step, index) in arrangedSteps"
                :key="index"
                class="flex h-full items-center gap-2"
              >
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-picton-blue-300 bg-picton-blue-100 text-lg font-bold text-picton-blue-700">
                  {{ index + 1 }}
                </div>

                <div class="h-full flex-grow">
                  <Droppable
                    v-if="step === ''"
                    :id="`step%${index}`"
                    class="flex h-full items-center justify-center rounded border border-picton-blue-200 bg-white"
                    isOverClassName="bg-lemon-100"
                  />

                  <div
                    v-else-if="showResults"
                    :class="
                      isCorrect(step, index)
                        ? 'relative flex h-full items-center gap-2 rounded border border-picton-blue-200 bg-green-200 px-4 py-2 text-green-700'
                        : 'relative flex h-full items-center gap-2 rounded border border-picton-blue-200 bg-red-200 px-4 py-2 text-red-700'
                    "
                  >
                    <div class="flex items-center gap-2">
                      <div v-if="step.image" class="w-fit h-full flex items-center gap-4">
                        <img :src="step.image" :alt="step.text" class="h-full max-w-36 object-contain">
                        <p>{{ step.text }}</p>
                      </div>
                      <span v-else>{{ step.text }}</span>
                    </div>
                    <span class="absolute right-2 top-2 text-2xl" :class="isCorrect(step, index) ? 'text-green-600' : 'text-red-600'">
                      {{ isCorrect(step, index) ? "✓" : "✕" }}
                    </span>
                    <span
                      v-if="!isCorrect(step, index) && props.questions.steps[index]"
                      class="text-green-700"
                    >
                      {{ props.questions.steps[index].text }}
                    </span>
                  </div>

                  <Draggable
                    v-else
                    :id="`${step.id}%${index}`"
                    class="relative flex h-full items-center border border-picton-blue-200 bg-lemon-200 px-4 py-2 text-lemon-700"
                  >
                    <div class="flex items-center gap-2">
                      <div v-if="step.image" class="w-fit h-full flex items-center gap-4">
                        <img :src="step.image" :alt="step.text" class="h-full max-w-36 object-contain">
                        <p>{{ step.text }}</p>
                      </div>
                      <span v-else>{{ step.text }}</span>
                    </div>
                  </Draggable>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!showResults" class="relative mt-6 flex h-[100px] flex-wrap gap-2">
          <Draggable
            v-for="(step, index) in steps"
            :key="step.id"
            :id="step.id"
            class="absolute flex h-full w-1/2 flex-grow items-center rounded border border-lemon-300 bg-lemon-100 px-4 py-2 text-lg text-lemon-700"
            :style="{ left: `${index * 50}px` }"
          >
            <div v-if="step.image" class="w-fit h-full flex items-center gap-4">
              <img :src="step.image" :alt="step.text" class="h-full max-w-36 object-contain">
              <p>{{ step.text }}</p>
            </div>
            <span v-else>{{ step.text }}</span>
          </Draggable>
        </div>
      </DNDContext>

      <div v-if="showResults" class="mt-4">
        <ActivityResults :score="score" :total="props.questions.steps.length" :onRestart="resetActivity" />
      </div>

      <ActivityResultsAlertDialog
        :score="score"
        :total="props.questions.steps.length"
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
  </div>
</template>
