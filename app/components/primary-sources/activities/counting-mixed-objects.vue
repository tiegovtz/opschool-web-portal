<script setup lang="ts">
import { ref, watch } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    questions: { type: string; src: string; count: string }[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const generateItems = () => {
  const items: { id: string; type: string; src: string }[] = [];

  props.questions.questions.forEach((question) => {
    const count = Number.parseInt(question.count, 10);
    for (let index = 0; index < count; index += 1) {
      items.push({
        id: `${question.type}-${index}`,
        type: question.type,
        src: question.src,
      });
    }
  });

  return shuffle(items);
};

const items = ref(generateItems());
const questionsState = ref(props.questions.questions);
const userCounts = ref<Record<string, string>>({});
const isCompleted = ref(false);
const isResultsDialogOpen = ref(false);
const score = ref(0);

const initializeCounts = () => {
  userCounts.value = props.questions.questions.reduce((acc, question) => {
    acc[question.type] = "";
    return acc;
  }, {} as Record<string, string>);
};

watch(
  () => props.questions,
  () => {
    items.value = generateItems();
    questionsState.value = props.questions.questions;
    initializeCounts();
    isCompleted.value = false;
    isResultsDialogOpen.value = false;
    score.value = 0;
  },
  { deep: true, immediate: true },
);

const checkAnswers = () =>
  props.questions.questions.reduce(
    (total, question) => total + (userCounts.value[question.type] === question.count ? 1 : 0),
    0,
  );

const handleComplete = () => {
  score.value = checkAnswers();
  isCompleted.value = true;
  isResultsDialogOpen.value = true;
  playSound("success");
};

const handleRestart = () => {
  isCompleted.value = false;
  initializeCounts();
  items.value = generateItems();
  questionsState.value = shuffle([...props.questions.questions]);
};

const handleCountChange = (type: string, value: string) => {
  if (value === "" || /^\d+$/.test(value)) {
    userCounts.value = {
      ...userCounts.value,
      [type]: value,
    };
  }
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex h-full flex-col gap-4">
      <div class="flex h-full flex-col gap-4 md:flex-row">
        <div class="relative flex h-full w-full flex-wrap items-center justify-center gap-2 rounded bg-picton-blue-50 p-4">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="flex h-16 w-16 cursor-move items-center justify-center rounded border border-picton-blue-300 bg-picton-blue-100 transition-transform duration-300 hover:scale-125 md:h-24 md:w-24"
          >
            <img :src="item.src" :alt="item.type" class="max-h-full max-w-full">
          </div>
        </div>

        <div
          :class="
            cn('space-y-4 rounded bg-picton-blue-50 p-1 md:p-4', {
              'md:w-1/2': !isCompleted,
              'md:w-3/4': isCompleted,
            })
          "
        >
          <div class="flex flex-row gap-4 md:flex-col md:gap-4">
            <div
              v-for="(question, index) in questionsState"
              :key="index"
              :class="
                isCompleted
                  ? userCounts[question.type] === question.count
                    ? 'flex flex-col items-center rounded border border-green-200 bg-green-50 md:flex-row md:space-x-3 md:p-2'
                    : 'flex flex-col items-center rounded border border-red-200 bg-red-50 md:flex-row md:space-x-3 md:p-2'
                  : 'flex flex-col items-center md:flex-row md:space-x-3 md:p-2'
              "
            >
              <div class="flex h-10 items-center justify-center md:h-14">
                <img :src="question.src" :alt="question.type" class="h-full w-full object-contain">
              </div>

              <div class="inline-block align-middle">
                <Input
                  :model-value="userCounts[question.type]"
                  type="text"
                  maxlength="2"
                  :disabled="isCompleted"
                  :class="
                    isCompleted
                      ? userCounts[question.type] === question.count
                        ? 'max-w-24 rounded-none border-none bg-transparent px-0 text-center text-xl text-green-700 md:!text-4xl'
                        : 'max-w-24 rounded-none border-none bg-transparent px-0 text-center text-xl text-red-700 md:!text-4xl'
                      : 'max-w-24 rounded-none border-none bg-transparent px-0 text-center text-xl text-picton-blue-700 md:!text-4xl'
                  "
                  @update:model-value="
                    (value) => handleCountChange(question.type, String(value ?? ''))
                  "
                />
                <div
                  :class="
                    isCompleted
                      ? userCounts[question.type] === question.count
                        ? 'border-b border-dashed border-green-700'
                        : 'border-b border-dashed border-red-700'
                      : 'border-b border-dashed border-picton-blue-700'
                  "
                />
              </div>

              <div class="flex-1">
                <div v-if="isCompleted" class="mt-1 text-sm">
                  <span
                    :class="
                      userCounts[question.type] === question.count
                        ? 'font-semibold text-green-700'
                        : 'font-semibold text-red-700'
                    "
                  >
                    {{
                      userCounts[question.type] === question.count
                        ? `${ui.correct}!`
                        : ui.formatIncorrectAnswer(question.count)
                    }}
                  </span>

                  <div class="mt-1 flex flex-wrap">
                    <div
                      v-for="visualIndex in Number.parseInt(question.count, 10)"
                      :key="visualIndex"
                      class="m-1 flex h-8 w-8 items-center justify-center"
                    >
                      <img :src="question.src" :alt="question.type" class="max-h-full max-w-full">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!isCompleted" class="mx-auto w-fit md:mx-0 md:ml-auto">
            <Button
              variant="brand-lemon"
              :disabled="Object.values(userCounts).some((value) => value === '')"
              @click="handleComplete"
            >
              {{ ui.checkAnswers }}
            </Button>
          </div>
        </div>
      </div>

      <ActivityResults
        v-if="isCompleted"
        :score="score"
        :total="props.questions.questions.length"
        :onRestart="handleRestart"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="isResultsDialogOpen"
      :onOpenChange="(open: boolean) => { isResultsDialogOpen = open; }"
    />
  </div>
</template>
