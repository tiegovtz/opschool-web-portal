<script lang="ts">
export const detectFractionPattern = (answer: string) => {
  const isFraction = /^frac\((\d+\/\d+)\)$/.test(answer);
  const isMixedFraction = /^frac\((\d+\/\d+\/\d+)\)$/.test(answer);

  return {
    isFraction: isFraction || isMixedFraction,
    isMixed: isMixedFraction,
  };
};

export const getEmptyFractionValue = (isMixed: boolean) =>
  isMixed ? "frac(//)" : "frac(/)";
</script>

<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";
import { cn } from "~/utilities/utils";
import Input from "~/components/ui/inputs/input.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
    isMixed: boolean;
    isChecked?: boolean;
    colorScheme?: "blue" | "yellow" | "green" | "red";
    readOnly?: boolean;
  }>(),
  {
    disabled: false,
    isChecked: false,
    colorScheme: "blue",
    readOnly: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const parseFraction = (val: string) => {
  const match = val.match(/frac\(([\d/]*)\)/);
  if (!match) return props.isMixed ? ["", "", ""] : ["", ""];
  const parts = match[1]?.split("/") as string[];
  return props.isMixed
    ? [parts[0] || "", parts[1] || "", parts[2] || ""]
    : [parts[0] || "", parts[1] || ""];
};

const parts = computed(() => {
  if (props.isMixed) {
    const [w, n, d] = parseFraction(props.modelValue);
    return { whole: w, numerator: n, denominator: d };
  }
  const [n, d] = parseFraction(props.modelValue);
  return { whole: "", numerator: n, denominator: d };
});

const handleChange = (
  part: "whole" | "numerator" | "denominator",
  val: string,
) => {
  if (val !== "" && !/^\d+$/.test(val)) return;

  const { whole, numerator, denominator } = parts.value;
  let newValue: string;
  if (props.isMixed) {
    const w = part === "whole" ? val : whole;
    const n = part === "numerator" ? val : numerator;
    const d = part === "denominator" ? val : denominator;
    newValue = `frac(${w}/${n}/${d})`;
  } else {
    const n = part === "numerator" ? val : numerator;
    const d = part === "denominator" ? val : denominator;
    newValue = `frac(${n}/${d})`;
  }
  emit("update:modelValue", newValue);
};

const colors = computed(() => {
  if (props.colorScheme === "green") {
    return { border: "border-green-500", divider: "border-green-500" };
  }
  if (props.colorScheme === "red") {
    return { border: "border-red-500", divider: "border-red-500" };
  }
  if (props.isChecked) {
    return { border: "border-lemon-500", divider: "border-lemon-500" };
  }
  return { border: "border-picton-blue-500", divider: "border-picton-blue-500" };
});
</script>

<template>
  <span class="inline-flex items-center gap-1 mx-1">
    <template v-if="isMixed">
      <Input
        type="text"
        :model-value="parts.whole"
        :disabled="disabled"
        :readonly="readOnly"
        :class="
          cn(
            'w-12 h-10 px-1 text-center bg-transparent rounded border-2',
            colors.border,
            {
              'cursor-not-allowed': disabled || readOnly,
            },
          )
        "
        @update:model-value="handleChange('whole', $event)"
      />
    </template>
    <span class="inline-flex flex-col gap-1 items-center">
      <Input
        type="text"
        :model-value="parts.numerator"
        :disabled="disabled"
        :readonly="readOnly"
        :class="
          cn(
            'w-12 h-8 px-1 text-center border-2 focus:outline-none bg-transparent',
            colors.border,
            {
              'cursor-not-allowed': disabled || readOnly,
            },
          )
        "
        @update:model-value="handleChange('numerator', $event)"
      />
      <div :class="cn('w-full border-b-2', colors.divider)" />
      <Input
        type="text"
        :model-value="parts.denominator"
        :disabled="disabled"
        :readonly="readOnly"
        :class="
          cn(
            'w-12 h-8 px-1 text-center border-2 focus:outline-none bg-transparent',
            colors.border,
            {
              'cursor-not-allowed': disabled || readOnly,
            },
          )
        "
        @update:model-value="handleChange('denominator', $event)"
      />
    </span>
  </span>
</template>
