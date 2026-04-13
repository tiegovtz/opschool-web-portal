<script setup lang="tsx">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";

// Local imports
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, { ActivityResultsAlertDialog } from "@/components/templates/results";
import { shuffle } from "~/utilities/utils";
import DNDContext from "~/components/layout/dnd-context";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";
import { ActivityType } from "~/types/activity-types";

// Props
type QuestionItem = {
  question: string;
  image?: string;
  answer: string;
};

type OptionItem = {
  value: string;
  image?: string;
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    algorithm?: string;
    questions: QuestionItem[];
    options: OptionItem[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();

// State
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const answers = ref<Record<number, { value: string; optionId: string; image?: string }>>({});
const activityInstructionsId = "complete-sentences-dragging-clues-instructions";

// Shuffle options
type UniqueOption = { id: string; value: string; image?: string; uniqueIndex: number };
const initialOptions = props.questions.options.map((opt, idx) => ({
  id: `option-${idx}`,
  value: opt.value,
  image: opt.image,
  uniqueIndex: idx,
}));

const shuffledOptions = ref<UniqueOption[]>(shuffle([...initialOptions]));

const questionParts = (question: string) => String(question ?? "").split("___");

function handleDragEnd({ active, over }: any) {
  if (!over) return;

  const activeIdParts = active.id.split("%");
  const dropQuestionIndex = parseInt(over.id.split("%")[0]);

  let activeOptionUniqueId: string;
  let activeOptionValue: string;
  let activeOptionImage: string | undefined;

  // Dragging from answered question
  if (activeIdParts.length === 3) {
    const sourceQuestionIndex = parseInt(activeIdParts[0]);
    const sourceAnswer = answers.value[sourceQuestionIndex];
    if (sourceAnswer) {
      activeOptionUniqueId = sourceAnswer.optionId;
      activeOptionValue = sourceAnswer.value;
      activeOptionImage = sourceAnswer.image;
    } else {
      activeOptionUniqueId = activeIdParts[1];
      activeOptionValue = activeIdParts[2];
    }
  } else {
    activeOptionUniqueId = activeIdParts[0];
    activeOptionValue = activeIdParts[1];
    const option = shuffledOptions.value.find((opt) => opt.id === activeOptionUniqueId);
    activeOptionImage = option?.image;
  }

  const newAnswers = { ...answers.value };

  // Remove from source if dragging from question
  if (activeIdParts.length === 3) {
    const sourceQuestionIndex = parseInt(activeIdParts[0]);
    if (sourceQuestionIndex !== dropQuestionIndex) {
      delete newAnswers[sourceQuestionIndex];
    }
  }

  // Remove previous answer in target
  if (newAnswers[dropQuestionIndex]) delete newAnswers[dropQuestionIndex];

  // Remove option used elsewhere
  const previousQuestionIndex = Object.entries(newAnswers).find(
    ([, ans]) => ans.optionId === activeOptionUniqueId
  )?.[0];
  if (previousQuestionIndex) delete newAnswers[parseInt(previousQuestionIndex)];

  // Assign to new question
  newAnswers[dropQuestionIndex] = {
    value: activeOptionValue,
    optionId: activeOptionUniqueId,
    image: activeOptionImage,
  };
  answers.value = newAnswers;

  // Update status
  allAnswered.value = Object.keys(newAnswers).length === props.questions.questions.length;

  // Calculate score if complete
  if (allAnswered.value) {
    score.value = props.questions.questions.reduce(
      (acc, q, idx) => acc + (newAnswers[idx]?.value === q.answer ? 1 : 0),
      0
    );
  }
}

// Available options
const getAvailableOptions = computed(() =>
  shuffledOptions.value.filter(
    (opt) => !Object.values(answers.value).some((a) => a.optionId === opt.id)
  )
);

// Reset activity
function handleTryAgain() {
  allAnswered.value = false;
  showResults.value = false;
  score.value = 0;
  answers.value = {};
  shuffledOptions.value = shuffle([...initialOptions]);
}
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-dragging-clues-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-dragging-clues-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Buruta kila kidokezo hadi kwenye nafasi inayolingana. Ukimaliza, dirisha la matokeo litaonekana na sehemu ya mwisho ya matokeo itaonyesha majibu yaliyokuwa sahihi au yasiyo sahihi."
        : "Drag each clue into the matching blank. After you finish, the results dialog will appear and the final results section will show which answers were correct or incorrect." }}
    </p>

    <div
      class="flex flex-col h-full bg-picton-blue-100 gap-2"
      :style="{ fontSize: props.questions.fontSize ? props.questions.fontSize + 'px' : '20px' }"
    >
      <DNDContext :onDragEnd="handleDragEnd">
        <!-- Options pool -->
        <div class="flex flex-wrap gap-2 md:gap-4 mb-4 shrink-0">
          <Draggable
            v-for="option in getAvailableOptions"
            :key="option.id"
            :id="`${option.id}%${option.value}`"
            class="rounded flex min-w-32 border border-picton-blue-400 overflow-hidden items-center justify-center bg-picton-blue-200 h-12 p-2"
          >
            <img
              v-if="questions.algorithm === ActivityType.CompleteSentencesByDraggingCluesPics "
              :src="option.image"
              :alt="option.value"
              class="w-full h-full object-contain"
            />
            <template v-else>{{ option.value }}</template>
          </Draggable>
        </div>

        <!-- Questions -->
        <div
          v-for="(question, i) in props.questions.questions"
          :key="i"
          class="flex md:items-center rounded-md gap-2 md:gap-6 p-3 bg-picton-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
          :class="showResults ? (answers[i]?.value === question.answer ? 'bg-green-100' : 'bg-red-100') : ''"
          role="group"
          tabindex="0"
          :aria-labelledby="`complete-sentences-dragging-clues-question-${i}`"
          :aria-describedby="showResults ? `complete-sentences-dragging-clues-result-${i}` : undefined"
        >
          <div class="flex flex-col md:flex-row items-start gap-2">
            <img
              v-if="question.image"
              :src="question.image"
              alt="question"
              class="min-w-24 h-20 object-cover rounded-md"
            />

            <div class="flex flex-wrap items-center gap-2 leading-relaxed">
              <span :id="`complete-sentences-dragging-clues-question-${i}`" class="mr-1 font-bold text-picton-blue-700">
                {{ i + 1 }}.
              </span>

              <template v-for="(part, idx) in questionParts(question.question)" :key="idx">
                <span v-if="part" class="whitespace-pre-wrap">
                  {{ part }}
                </span>

                <template v-if="idx < questionParts(question.question).length - 1">
                  <Droppable
                    v-if="!answers[i]"
                    :id="`${i}%blank-${idx}`"
                    class="bg-picton-blue-100 min-w-32 rounded flex items-center justify-center h-12 border border-picton-blue-300"
                  />
                  <Draggable
                    v-else
                    :id="`${i}%${answers[i].optionId}%blank-${idx}`"
                    class="flex items-center min-w-32 border border-lemon-400 bg-lemon-100 text-lemon-700 h-12 p-2"
                    :disabled="showResults"
                  >
                    <img
                      v-if="answers[i].image"
                      :src="answers[i].image"
                      :alt="answers[i].value"
                      class="w-full h-full object-contain"
                    />
                    <template v-else>{{ answers[i].value }}</template>
                  </Draggable>

                  <Icon
                    v-if="showResults"
                    :icon="answers[i]?.value === question.answer ? 'mdi:check' : 'mdi:close'"
                    :class="answers[i]?.value === question.answer ? 'text-green-600' : 'text-red-600'"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  />
                </template>
              </template>
            </div>
          </div>
          <span
            v-if="showResults"
            :id="`complete-sentences-dragging-clues-result-${i}`"
            class="sr-only"
            role="status"
          >
            {{ ui.formatQuestionResult(i + 1, answers[i]?.value === question.answer) }}
          </span>
        </div>
      </DNDContext>

      <ActivityResults
        v-if="showResults"
        :score="score"
        :total="props.questions.questions.length"
        :onRestart="handleTryAgain"
        class-name="mt-2"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      :onRestart="handleTryAgain"
      :onOpenChange="(open:any) => {
        allAnswered = open;
        if (!open) showResults = true;
      }"
    />
  </section>
</template>
