<script setup lang="ts">
import { computed } from "vue";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utilities/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
  {
    variants: {
      variant: {
        default:
          "border-gray-200 bg-white file:text-gray-950 placeholder:text-gray-500",
        brand:
          "text-lemon-600 border-lemon-300 bg-lemon-50 file:text-lemon-800 placeholder:text-lemon-600 focus-visible:ring-lemon-600",
        picton:
          "text-picton-blue-500 border-picton-blue-300 bg-picton-blue-50 file:text-picton-blue-600 placeholder:text-picton-blue-500 focus-visible:ring-picton-blue-800 focus-visible:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type InputVariants = VariantProps<typeof inputVariants>;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    variant?: InputVariants["variant"];
    type?: string;
    removeArrows?: boolean;
    placeholder?: string;
    disabled?: boolean;
    class?: string;
  }>(),
  {
    variant: "default",
    type: "text",
    removeArrows: false,
    placeholder: "",
    disabled: false,
    class: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputClassName = computed(() =>
  cn(
    inputVariants({ variant: props.variant }),
    props.class,
    props.removeArrows &&
      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
  ),
);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <input
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :class="inputClassName"
    autocomplete="off"
    autocapitalize="off"
    autocorrect="off"
    :spellcheck="false"
    @input="handleInput"
  >
</template>
