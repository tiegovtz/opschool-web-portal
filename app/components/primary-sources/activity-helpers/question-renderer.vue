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

/** Question + correct answers only — does not depend on userAnswers (avoids re-running MathJax on every keystroke). */
type StructuralBlankItem = {
  kind: "blank";
  segment: SegmentWithBlank;
  blankIndex: number;
  correctAnswer: string;
  compound: ReturnType<typeof detectCompoundUnitArithmeticPattern>;
  fraction: ReturnType<typeof detectFractionPattern>;
  calculatedWidth: number;
  isTwoUnderscores: boolean;
};

type StructuralItem =
  | StructuralBlankItem
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

function isBlankCorrect(blankIndex: number) {
  if (props.mode === "results") return props.isCorrect;
  const ua = (props.userAnswers[blankIndex] || "").toLowerCase().trim();
  const ca = (props.answers[blankIndex] || "").toLowerCase().trim();
  return ua === ca;
}

function blankUserAnswer(blankIndex: number) {
  return props.userAnswers[blankIndex] || "";
}

const structuralRenderItems = computed((): StructuralItem[] =>
  segmentsWithBlankIndex.value.map((segment) => {
    if (segment.type === "blank" && segment.blankIndex !== null) {
      const blankIndex = segment.blankIndex;
      const correctAnswer = props.answers[blankIndex] || "";
      const compound = detectCompoundUnitArithmeticPattern(correctAnswer);
      const fraction = detectFractionPattern(correctAnswer);
      const { calculatedWidth, isTwoUnderscores } = calculateBlankWidth(
        segment.content.length,
        props.screenWidth,
      );
      return {
        kind: "blank",
        segment,
        blankIndex,
        correctAnswer,
        compound,
        fraction,
        calculatedWidth,
        isTwoUnderscores,
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
  const items = structuralRenderItems.value;
  if (items.length < 2) return null;
  const last = items[items.length - 1];
  if (last.kind !== "blank") return null;
  if (!last.compound.isCompoundUnitArithmetic) return null;
  if (items.filter((i) => i.kind === "blank").length !== 1) return null;
  return { leading: items.slice(0, -1), compoundBlank: last };
});
</script>

<template>
  <div v-if="metricCompoundSplit" class="metric-compound-question w-full max-w-full">
    <div
      class="metric-compound-row flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-start sm:gap-x-3 md:gap-x-4 rounded-xl bg-white/90 p-3 sm:p-4 shadow-sm border border-picton-blue-100"
    >
      <div
        class="metric-compound-math w-full sm:w-auto sm:shrink-0 min-w-0 text-picton-blue-900 [&_.MathJax]:m-0 [&_.MathJax]:text-picton-blue-900 [&_.MathJax_Display]:!m-0 [&_mjx-container]:!m-0 [&_mjx-math]:!my-0"
      >
        <span class="inline-flex flex-wrap items-center align-middle">
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
                  <span v-else v-mathjax="ks.value">{{ mathJaxWrap(ks.value) }}</span>
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
                  <span v-else v-mathjax="ks.value">{{ mathJaxWrap(ks.value) }}</span>
                </template>
              </span>
            </span>
          </template>
        </span>
      </div>
      <div
        class="metric-compound-inputs shrink-0 flex w-full sm:w-auto items-center justify-start sm:pl-1 md:pl-2"
      >
        <CompoundUnitArithmeticInput
          :model-value="
            blankUserAnswer(metricCompoundSplit.compoundBlank.blankIndex) ||
            getEmptyCompoundUnitArithmeticValue(
              metricCompoundSplit.compoundBlank.compound.columnCount,
            )
          "
          :disabled="disabled || mode === 'results'"
          :read-only="mode === 'results'"
          :is-checked="isChecked || mode === 'results'"
          :color-scheme="
            compoundColorScheme(
              mode,
              isBlankCorrect(metricCompoundSplit.compoundBlank.blankIndex),
              colorScheme,
            )
          "
          :column-count="metricCompoundSplit.compoundBlank.compound.columnCount"
          :correct-answer="metricCompoundSplit.compoundBlank.correctAnswer"
          @update:model-value="
            onBlankUpdate(metricCompoundSplit.compoundBlank.blankIndex, $event)
          "
        />
      </div>
    </div>
  </div>

  <template v-else v-for="item in structuralRenderItems" :key="`${item.segment.type}-${item.segment.index}`">
    <!-- blank -->
    <template v-if="item.kind === 'blank'">
      <span
        v-if="item.compound.isCompoundUnitArithmetic"
        class="inline-flex mx-1 relative"
      >
        <CompoundUnitArithmeticInput
          :model-value="
            blankUserAnswer(item.blankIndex) ||
            getEmptyCompoundUnitArithmeticValue(item.compound.columnCount)
          "
          :disabled="disabled || mode === 'results'"
          :read-only="mode === 'results'"
          :is-checked="isChecked || mode === 'results'"
          :color-scheme="
            compoundColorScheme(mode, isBlankCorrect(item.blankIndex), colorScheme)
          "
          :column-count="item.compound.columnCount"
          :correct-answer="item.correctAnswer"
          @update:model-value="onBlankUpdate(item.blankIndex, $event)"
        />
      </span>

      <span
        v-else-if="item.fraction.isFraction"
        class="inline-flex mx-1 relative"
      >
        <FractionInput
          :model-value="
            blankUserAnswer(item.blankIndex) ||
            getEmptyFractionValue(item.fraction.isMixed)
          "
          :disabled="disabled || mode === 'results'"
          :read-only="mode === 'results'"
          :is-mixed="item.fraction.isMixed"
          :is-checked="isChecked || mode === 'results'"
          :color-scheme="
            fractionColorScheme(mode, isBlankCorrect(item.blankIndex), colorScheme)
          "
          @update:model-value="onBlankUpdate(item.blankIndex, $event)"
        />
      </span>

      <span
        v-else
        :class="
          cn('inline-flex mx-1', blankClassName, {
            'flex-col': !item.isTwoUnderscores,
          })
        "
        :style="{
          width: `${item.calculatedWidth}px`,
        }"
      >
        <Input
          type="text"
          :model-value="blankUserAnswer(item.blankIndex)"
          :disabled="disabled || mode === 'results'"
          :readonly="mode === 'results'"
          :class="
            cn('min-w-0 px-2 text-center bg-transparent', {
              'border-none focus:outline-none': !item.isTwoUnderscores,
              'border rounded': item.isTwoUnderscores,
              [getBlankColorClasses(isBlankCorrect(item.blankIndex))]: true,
            })
          "
          :style="{
            maxWidth: `${item.calculatedWidth * 1.6}px`,
          }"
          @update:model-value="onBlankUpdate(item.blankIndex, $event)"
        />
        <div
          v-if="!item.isTwoUnderscores"
          :class="
            cn('border-b border-dashed', {
              'border-picton-blue-700': !isChecked && colorScheme === 'default',
              'border-lemon-700': isChecked && colorScheme === 'yellow',
              'border-green-500':
                isChecked && isBlankCorrect(item.blankIndex) && colorScheme === 'default',
              'border-red-500':
                isChecked && !isBlankCorrect(item.blankIndex) && colorScheme === 'default',
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
          <span v-else v-mathjax="ks.value">{{ mathJaxWrap(ks.value) }}</span>
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
          <span v-else v-mathjax="ks.value">{{ mathJaxWrap(ks.value) }}</span>
        </template>
      </span>
    </span>
  </template>
</template>
