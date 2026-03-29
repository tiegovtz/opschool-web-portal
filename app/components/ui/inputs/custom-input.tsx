// components/CustomInput.tsx
import { defineComponent, type PropType } from "vue";
import { Icon } from "@iconify/vue"; // using Iconify
import Input from "./input";
import { cn } from "~/utilities/utils";

export default defineComponent({
  name: "CustomInput",
  props: {
    value: { type: String, required: true },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    placeholder: String,
    disabled: Boolean,
    inputClassName: String,
    className: String,
    isCorrect: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    noBorder: { type: Boolean, default: false },
    correctAnswer: {
      type: [String, Number] as PropType<string | number>,
    },
  },
  setup(props) {
    return () => (
      <div class={cn("max-w-56 relative", props.className)}>
        <div class="relative">
          <Input
            type="text"
            modelValue={props.value}
            onUpdate:modelValue={props.onChange}
            placeholder={props.placeholder}
            disabled={props.disabled}
            class={cn(
              "p-2 bg-transparent text-center transition-colors duration-200 px-2 border-none",
              props.isCorrect === true &&
                "ring-2 ring-green-500 text-green-700 pr-8",
              props.isCorrect === false &&
                "ring-2 ring-red-500 text-red-700 pr-8",
              props.inputClassName,
            )}
          />

          {/* Correctness indicator */}
          {props.isCorrect !== undefined && (
            <div class="absolute right-2 top-1/2 -translate-y-1/2">
              {props.isCorrect ? (
                <Icon icon="mdi:check" class="w-4 h-4 text-green-600" />
              ) : (
                <Icon icon="mdi:close" class="w-4 h-4 text-red-600" />
              )}
            </div>
          )}

          {/* Correct answer tooltip */}
          {props.isCorrect === false && props.correctAnswer !== undefined && (
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap border border-emerald-200">
              Correct: {props.correctAnswer}
            </div>
          )}
        </div>

        {!props.noBorder && (
          <div
            class={cn(
              "border-b border-dashed transition-colors duration-200",
              props.isCorrect === true
                ? "border-green-500"
                : props.isCorrect === false
                  ? "border-red-500"
                  : "border-picton-blue-700",
            )}
          />
        )}
      </div>
    );
  },
});
