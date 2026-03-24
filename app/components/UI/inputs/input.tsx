// components/Input.tsx
import { defineComponent, type PropType } from "vue";
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
  }
);

type InputVariants = VariantProps<typeof inputVariants>;

export default defineComponent({
  name: "Input",
  inheritAttrs: false, // important for TSX control
  props: {
    modelValue: String,
    variant: {
      type: String as PropType<InputVariants["variant"]>,
      default: "default",
    },
    type: {
      type: String,
      default: "text",
    },
    removeArrows: {
      type: Boolean,
      default: false,
    },
    placeholder:{
      type:String,
      default:'',
    },
    disabled:{
      type:Boolean,
      default:false
    },
    class: String,
  },
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      emit("update:modelValue", target.value);
    };

    return () => (
      <input
        {...attrs}
        type={props.type}
        value={props.modelValue}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onInput={handleInput}
        class={cn(
          inputVariants({ variant: props.variant }),
          props.class,
          props.removeArrows &&
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        )}
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck={false}
      />
    );
  },
});
