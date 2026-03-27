import { defineComponent, type PropType } from "vue";
import { cn } from "~/utilities/utils";
import { cva, type VariantProps } from "class-variance-authority";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-white placeholder:text-neutral-500",
        brand:
          "border-lemon-300 bg-lemon-50 placeholder:text-lemon-600 focus-visible:ring-lemon-600",
        picton:
          "border-picton-blue-300 bg-picton-blue-50 placeholder:text-picton-blue-500 focus-visible:ring-picton-blue-800 text-picton-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps extends VariantProps<typeof textareaVariants> {
  modelValue?: string | number;
  value?: string | number;
  class?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (event: Event) => void;
  onInput?: (event: Event) => void;
}

const Textarea = defineComponent({
  name: "Textarea",
  inheritAttrs: false,
  props: {
    modelValue: [String, Number],
    value: [String, Number],
    variant: {
      type: String as PropType<TextareaProps["variant"]>,
      default: "default",
    },
    disabled: Boolean,
    class: String,
    className: String,
    onChange: Function as PropType<TextareaProps["onChange"]>,
    onInput: Function as PropType<TextareaProps["onInput"]>,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit }) {
    const handleInput = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      emit("update:modelValue", target.value);
      props.onInput?.(event);
      props.onChange?.(event);
    };

    return () => (
      <textarea
        {...attrs}
        class={cn(
          textareaVariants({ variant: props.variant }),
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
        disabled={props.disabled}
        value={props.modelValue ?? props.value ?? ""}
        onInput={handleInput}
        spellcheck={false}
      />
    );
  },
});

export { Textarea };
