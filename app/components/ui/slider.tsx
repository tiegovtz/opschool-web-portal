// Slider.tsx
import { defineComponent, h, computed } from "vue";
import { cn } from "@/lib/utils";

export const Slider = defineComponent({
  name: "Slider",
  props: {
    modelValue: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    disabled: { type: Boolean, default: false },
    class: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit("update:modelValue", Number(target.value));
    };

    const percentage = computed(() => {
      return ((props.modelValue - props.min) / (props.max - props.min)) * 100;
    });

    return () =>
      h("div", { class: cn("relative w-full flex items-center", props.class) }, [
        // Track
        h("div", {
          class: "absolute h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800",
        }),
        // Filled range
        h("div", {
          class: "absolute h-2 rounded-full bg-gray-900 dark:bg-gray-50",
          style: { width: `${percentage.value}%` },
        }),
        // Thumb
        h("input", {
          type: "range",
          min: props.min,
          max: props.max,
          step: props.step,
          value: props.modelValue,
          disabled: props.disabled,
          onInput: handleInput,
          class: cn(
            "appearance-none w-full h-5 bg-transparent cursor-pointer",
            "thumb:rounded-full thumb:border-2 thumb:border-gray-900 thumb:bg-white",
            "focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:thumb:border-gray-50 dark:thumb:bg-gray-950"
          ),
        }),
      ]);
  },
});