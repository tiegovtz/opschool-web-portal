<script setup lang="ts">
import { computed, useSlots } from "vue";
import Droppable from "~/components/ui/dnd/droppable";
import Draggable from "~/components/ui/dnd/draggable";
// import Input from "~/components/ui/inputs/input";
import { cn } from "~/utilities/utils";
import type { AnswerType } from "./answer-drop-zone.types";

type AnswerDropZoneProps = {
  id: string;
  answerType: AnswerType;
  currentAnswer?: string;
  correctAnswer?: string;
  showResults?: boolean;
  placeholder?: string;
  onInputChange?: (value: string) => void;
  onClickChange?: (value: string) => void;
  className?: string;
  isDraggable?: boolean;
  dragId?: string;
  isSelected?: boolean;
  ariaLabel?: string;
  ariaDescribedby?: string;
};

const props = withDefaults(defineProps<AnswerDropZoneProps>(), {
  currentAnswer: "",
  showResults: false,
  placeholder: "Drop answer here",
  className: "",
  isDraggable: false,
  isSelected: false,
});
const statusId = "answer-drop-zone-status";

const slots = useSlots();

const isCorrect = computed(
  () => props.showResults && props.currentAnswer === props.correctAnswer,
);
const isIncorrect = computed(
  () =>
    props.showResults &&
    props.currentAnswer !== props.correctAnswer &&
    props.currentAnswer !== "",
);

const resultStyles = computed(() => {
  if (!props.showResults) return "";
  if (isCorrect.value) return "!bg-green-200 !text-green-700 !border-green-300";
  if (isIncorrect.value) return "bg-red-200 text-red-700 border-red-300";
  return "";
});

const baseStyles = computed(
  () => `
    min-h-[60px] flex items-center justify-center bg-picton-blue-100 rounded-lg transition-colors duration-200
    ${props.className} ${resultStyles.value}
  `,
);

const renderTextContent = computed(() => {
  if (props.currentAnswer) return props.currentAnswer;
  return props.placeholder;
});
</script>

<template>
  <!-- drag-drop -->
  <template v-if="props.answerType === 'drag-drop'">
    <Draggable
      v-if="props.currentAnswer && props.isDraggable && props.dragId"
      :id="props.dragId"
      :class="`${baseStyles} bg-lemon-200 text-lemon-700 cursor-move focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2`"
    >
      <slot v-if="slots.default" />
      <template v-else>{{ renderTextContent }}</template>
    </Draggable>

    <Droppable
      v-else
      :id="props.id"
      :class="`${baseStyles} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2`"
      isOverClassName="bg-lemon-100 border-lemon-400"
    >
      <slot v-if="slots.default" />
      <template v-else>{{ renderTextContent }}</template>
    </Droppable>
  </template>

  <!-- input -->
  <template v-else-if="props.answerType === 'input'">
    <div :class="props.className">
      <Input
        type="text"
        :model-value="props.currentAnswer"
        :disabled="props.showResults"
        :placeholder="props.placeholder"
        :aria-label="props.ariaLabel"
        :aria-describedby="props.ariaDescribedby"
        :class="
          cn(
            'text-center border-none font-medium !text-3xl bg-transparent focus-visible:ring-offset-0',
            props.showResults && {
              'bg-green-200 text-green-600': isCorrect,
              'bg-red-100 text-red-600': isIncorrect,
            },
          )
        "
        @update:modelValue="(v: string) => props.onInputChange?.(v)"
      />
      <div
        :class="
          cn(
            'border-b border-dashed mt-1',
            props.showResults
              ? {
                  'border-green-600': isCorrect,
                  'border-red-600': isIncorrect,
                }
              : 'border-picton-blue-700',
          )
        "
      />
    </div>
  </template>

  <!-- click -->
  <template v-else-if="props.answerType === 'click'">
    <button
      type="button"
      :aria-label="props.ariaLabel"
      :aria-describedby="props.ariaDescribedby"
      :aria-pressed="props.isSelected"
      :disabled="props.showResults"
      :class="`transition-colors
        ${props.isSelected ? 'bg-picton-blue-200 border-picton-blue-400' : ''}
        ${props.showResults ? 'cursor-default' : 'cursor-pointer hover:bg-picton-blue-100'}
        ${baseStyles} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2`"
      @click="() => !props.showResults && props.onClickChange?.(props.id)"
    >
      <div class="flex items-center justify-center gap-2">
        <slot v-if="slots.default" />
        <template v-else>{{ renderTextContent }}</template>
        <span v-if="props.isSelected" class="text-2xl leading-none">✓</span>
      </div>
    </button>
  </template>

  <!-- fallback -->
  <template v-else>
    <div :class="baseStyles">
      <slot v-if="slots.default" />
      <template v-else>{{ renderTextContent }}</template>
    </div>
  </template>
</template>
