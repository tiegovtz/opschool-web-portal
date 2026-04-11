<script setup lang="ts">
// @ts-nocheck
/**
 * Reusable component for rendering questions with math (MathJax), blanks, and highlighted text.
 */
import { computed } from "vue";
import { cn, extractKatexSegments } from "~/utilities/utils";
import Input from "~/components/ui/inputs/input.vue";
import FractionInput, {
  detectFractionPattern,
  getEmptyFractionValue,
} from "~/components/ui/fraction-input.vue";
import CompoundUnitArithmeticInput, {
  detectCompoundUnitArithmeticPattern,
  getEmptyCompoundUnitArithmeticValue,
} from "~/components/ui/compound-unit-arithmetic-input.tsx";
import {
  parseQuestionSegments,
  calculateBlankWidth,
  type QuestionSegment,
} from "./question-renderer-utils";

export type QuestionRendererMode = "activity" | "exam" | "results";

export interface QuestionRendererProps {
  question: string;
  answers: string[];
  userAnswers?: string[];
  mode?: QuestionRendererMode;
  isChecked?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  screenWidth?: number;
  highlightClassName?: string;
  textClassName?: string;
  blankClassName?: string;
  colorScheme?: "default" | "green" | "red" | "yellow";
}

const props = withDefaults(defineProps<QuestionRendererProps>(), {
  userAnswers: () => [],
  mode: "activity",
  isChecked: false,
  isCorrect: false,
  disabled: false,
  screenWidth: 1024,
  colorScheme: "default",
});

const emit = defineEmits<{
  blankChange: [blankIndex: number, value: string];
}>();

type SegmentWithBlank = QuestionSegment & {
  blankIndex: number | null;
};

type BlankRenderState = {
  blankIndex: number;
  userAnswer: string;
  correctAnswer: string;
  compound: ReturnType<typeof detectCompoundUnitArithmeticPattern>;
  fraction: ReturnType<typeof detectFractionPattern>;
  blankIsCorrect: boolean;
  calculatedWidth: number;
  isTwoUnderscores: boolean;
};

type RenderItem =
  | { kind: "blank"; segment: SegmentWithBlank; state: BlankRenderState }
  | { kind: "highlighted"; segment: SegmentWithBlank }
  | { kind: "text"; segment: SegmentWithBlank };

const segmentsWithBlankIndex = computed((): SegmentWithBlank[] => {
  let blankCount = 0;
  return parseQuestionSegments(props.question).map((segment) => {
    if (segment.type === "blank") {
      const blankIndex = blankCount;
      blankCount++;
      return { ...segment, blankIndex };
    }
    return { ...segment, blankIndex: null };
  });
});

function computeBlankState(
  blankIndex: number,
  underscoreCount: number,
): BlankRenderState {
  const userAnswer = props.userAnswers[blankIndex] || "";
  const correctAnswer = props.answers[blankIndex] || "";
  const compound = detectCompoundUnitArithmeticPattern(correctAnswer);
  const fraction = detectFractionPattern(correctAnswer);
  const blankIsCorrect =
    props.mode === "results"
      ? props.isCorrect
      : userAnswer.toLowerCase().trim() ===
        correctAnswer.toLowerCase().trim();
  const { calculatedWidth, isTwoUnderscores } = calculateBlankWidth(
    underscoreCount,
    props.screenWidth,
  );
  return {
    blankIndex,
    userAnswer,
    correctAnswer,
    compound,
    fraction,
    blankIsCorrect,
    calculatedWidth,
    isTwoUnderscores,
  };
}

const renderItems = computed((): RenderItem[] =>
  segmentsWithBlankIndex.value.map((segment) => {
    if (segment.type === "blank" && segment.blankIndex !== null) {
      return {
        kind: "blank",
        segment,
        state: computeBlankState(
          segment.blankIndex,
          segment.content.length,
        ),
      };
    }
    if (segment.type === "highlighted") {
      return { kind: "highlighted", segment };
    }
    return { kind: "text", segment };
  }),
);

const katexSegs = (text: string) => extractKatexSegments(text);

const hasMathInText = (text: string) =>
  katexSegs(text).some((s) => s.type === "math");

const mathJaxWrap = (latex: string) =>
  latex.includes("\\begin{array}") ? `\\[${latex}\\]` : `\\(${latex}\\)`;

const getBlankColorClasses = (blankIsCorrect: boolean) => {
  if (props.mode === "results") {
    return blankIsCorrect
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-red-100 text-red-800 border-red-300";
  }

  if (props.isChecked) {
    if (props.colorScheme === "yellow") {
      return "border-lemon-700";
    }
    return blankIsCorrect
      ? "border-green-500 bg-green-50"
      : "border-red-500 bg-red-50";
  }

  switch (props.colorScheme) {
    case "green":
      return "border-green-500";
    case "red":
      return "border-red-500";
    case "yellow":
      return "border-lemon-700";
    default:
      return "border-picton-blue-300";
  }
};

const onBlankUpdate = (blankIndex: number, value: string) => {
  if (!props.disabled) {
    emit("blankChange", blankIndex, value);
  }
};

const compoundColorScheme = (
  mode: QuestionRendererMode,
  blankIsCorrect: boolean,
  colorScheme: QuestionRendererProps["colorScheme"],
): "blue" | "yellow" | "green" | "red" => {
  if (mode === "results") {
    return blankIsCorrect ? "green" : "red";
  }
  if (colorScheme === "default") {
    return "blue";
  }
  return colorScheme;
};

const fractionColorScheme = (
  mode: QuestionRendererMode,
  blankIsCorrect: boolean,
  colorScheme: QuestionRendererProps["colorScheme"],
): "blue" | "yellow" | "green" | "red" | undefined => {
  if (mode === "results") {
    return blankIsCorrect ? "green" : "red";
  }
  if (colorScheme === "default") {
    return undefined;
  }
  return colorScheme;
};

/** One compound blank at the end: show vertical math on the left, unit inputs on the right. */
const metricCompoundSplit = computed(() => {
  const items = renderItems.value;
  if (items.length < 2) return null;
  const last = items[items.length - 1];
  if (last.kind !== "blank") return null;
  if (!last.state.compound.isCompoundUnitArithmetic) return null;
  if (items.filter((i) => i.kind === "blank").length !== 1) return null;
  return { leading: items.slice(0, -1), compound: last };
});
</script>

<template>
  <div v-if="metricCompoundSplit" class="metric-compound-question w-full max-w-full">
    <div
      class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10 rounded-xl bg-white/90 p-4 shadow-sm border border-picton-blue-100"
    >
      <div
        class="flex-1 min-w-0 text-picton-blue-900 [&_.MathJax]:text-picton-blue-900"
      >
        <template
          v-for="item in metricCompoundSplit.leading"
          :key="`${item.segment.type}-${item.segment.index}`"
        >
          <span
            v-if="item.kind === 'highlighted'"
            :class="
              cn(
                'bg-picton-blue-200 text-picton-blue-700 px-2 rounded mx-1 items-center leading-loose',
                highlightClassName,
              )
            "
          >
            <template v-if="!hasMathInText(item.segment.content)">
              <span class="whitespace-pre-line">{{ item.segment.content }}</span>
            </template>
            <span v-else>
              <template v-for="(ks, ki) in katexSegs(item.segment.content)" :key="ki">
                <span v-if="ks.type === 'text'">{{ ks.value }}</span>
                <span v-else v-mathjax>{{ mathJaxWrap(ks.value) }}</span>
              </template>
            </span>
          </span>
          <span
            v-else
            :class="cn('mx-1 items-center leading-loose', textClassName)"
          >
            <template v-if="!hasMathInText(item.segment.content)">
              <span class="whitespace-pre-line">{{ item.segment.content }}</span>
            </template>
            <span v-else>
              <template v-for="(ks, ki) in katexSegs(item.segment.content)" :key="ki">
                <span v-if="ks.type === 'text'">{{ ks.value }}</span>
                <span v-else v-mathjax>{{ mathJaxWrap(ks.value) }}</span>
              </template>
            </span>
          </span>
        </template>
      </div>
      <div
        class="shrink-0 flex w-full md:w-auto justify-center md:justify-end pt-1 md:pt-2 md:min-w-[12rem]"
      >
        <CompoundUnitArithmeticInput
          :model-value="
            metricCompoundSplit.compound.state.userAnswer ||
            getEmptyCompoundUnitArithmeticValue(
              metricCompoundSplit.compound.state.compound.columnCount,
            )
          "
          :disabled="disabled || mode === 'results'"
          :read-only="mode === 'results'"
          :is-checked="isChecked || mode === 'results'"
          :color-scheme="
            compoundColorScheme(
              mode,
              metricCompoundSplit.compound.state.blankIsCorrect,
              colorScheme,
            )
          "
          :column-count="metricCompoundSplit.compound.state.compound.columnCount"
          :correct-answer="metricCompoundSplit.compound.state.correctAnswer"
          @update:model-value="
            onBlankUpdate(metricCompoundSplit.compound.state.blankIndex, $event)
          "
        />
      </div>
    </div>
  </div>

  <template v-else v-for="item in renderItems" :key="`${item.segment.type}-${item.segment.index}`">
    <!-- blank -->
    <template v-if="item.kind === 'blank'">
      <span
        v-if="item.state.compound.isCompoundUnitArithmetic"
        class="inline-flex mx-1 relative"
      >
        <CompoundUnitArithmeticInput
          :model-value="
            item.state.userAnswer ||
            getEmptyCompoundUnitArithmeticValue(item.state.compound.columnCount)
          "
          :disabled="disabled || mode === 'results'"
          :read-only="mode === 'results'"
          :is-checked="isChecked || mode === 'results'"
          :color-scheme="
            compoundColorScheme(mode, item.state.blankIsCorrect, colorScheme)
          "
          :column-count="item.state.compound.columnCount"
          :correct-answer="item.state.correctAnswer"
          @update:model-value="onBlankUpdate(item.state.blankIndex, $event)"
        />
      </span>

      <span
        v-else-if="item.state.fraction.isFraction"
        class="inline-flex mx-1 relative"
      >
        <FractionInput
          :model-value="
            item.state.userAnswer ||
            getEmptyFractionValue(item.state.fraction.isMixed)
          "
          :disabled="disabled || mode === 'results'"
          :read-only="mode === 'results'"
          :is-mixed="item.state.fraction.isMixed"
          :is-checked="isChecked || mode === 'results'"
          :color-scheme="
            fractionColorScheme(mode, item.state.blankIsCorrect, colorScheme)
          "
          @update:model-value="onBlankUpdate(item.state.blankIndex, $event)"
        />
      </span>

      <span
        v-else
        :class="
          cn('inline-flex mx-1', blankClassName, {
            'flex-col': !item.state.isTwoUnderscores,
          })
        "
        :style="{
          width: `${item.state.calculatedWidth}px`,
        }"
      >
        <Input
          type="text"
          :model-value="item.state.userAnswer"
          :disabled="disabled || mode === 'results'"
          :readonly="mode === 'results'"
          :class="
            cn('min-w-0 px-2 text-center bg-transparent', {
              'border-none focus:outline-none': !item.state.isTwoUnderscores,
              'border rounded': item.state.isTwoUnderscores,
              [getBlankColorClasses(item.state.blankIsCorrect)]: true,
            })
          "
          :style="{
            maxWidth: `${item.state.calculatedWidth * 1.6}px`,
          }"
          @update:model-value="onBlankUpdate(item.state.blankIndex, $event)"
        />
        <div
          v-if="!item.state.isTwoUnderscores"
          :class="
            cn('border-b border-dashed', {
              'border-picton-blue-700': !isChecked && colorScheme === 'default',
              'border-lemon-700': isChecked && colorScheme === 'yellow',
              'border-green-500':
                isChecked && item.state.blankIsCorrect && colorScheme === 'default',
              'border-red-500':
                isChecked && !item.state.blankIsCorrect && colorScheme === 'default',
            })
          "
        />
      </span>
    </template>

    <!-- highlighted -->
    <span
      v-else-if="item.kind === 'highlighted'"
      :class="
        cn(
          'bg-picton-blue-200 text-picton-blue-700 px-2 rounded mx-1 items-center leading-loose',
          highlightClassName,
        )
      "
    >
      <template v-if="!hasMathInText(item.segment.content)">
        <span class="whitespace-pre-line">{{ item.segment.content }}</span>
      </template>
      <span v-else>
        <template v-for="(ks, ki) in katexSegs(item.segment.content)" :key="ki">
          <span v-if="ks.type === 'text'">{{ ks.value }}</span>
          <span v-else v-mathjax>{{ mathJaxWrap(ks.value) }}</span>
        </template>
      </span>
    </span>

    <!-- text -->
    <span
      v-else
      :class="cn('mx-1 items-center leading-loose', textClassName)"
    >
      <template v-if="!hasMathInText(item.segment.content)">
        <span class="whitespace-pre-line">{{ item.segment.content }}</span>
      </template>
      <span v-else>
        <template v-for="(ks, ki) in katexSegs(item.segment.content)" :key="ki">
          <span v-if="ks.type === 'text'">{{ ks.value }}</span>
          <span v-else v-mathjax>{{ mathJaxWrap(ks.value) }}</span>
        </template>
      </span>
    </span>
  </template>
</template>
