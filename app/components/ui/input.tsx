import { defineComponent, type PropType } from "vue";
import { cn } from "~/utilities/utils";

const Input = defineComponent({
  name: "Input",
  inheritAttrs: false,
  props: {
    type: {
      type: String,
      default: "text",
    },
    modelValue: [String, Number],
    value: [String, Number],
    disabled: Boolean,
    placeholder: String,
    class: String,
    className: String,
    onChange: Function as PropType<(event: Event) => void>,
    onInput: Function as PropType<(event: Event) => void>,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit }) {
    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit("update:modelValue", target.value);
      props.onInput?.(event);
      props.onChange?.(event);
    };

    return () => (
      <input
        {...attrs}
        type={props.type}
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={props.modelValue ?? props.value ?? ""}
        onInput={handleInput}
        class={cn(
          "flex h-10 w-full rounded-xl border border-oceanBlue/20 bg-white px-3 py-2 text-base text-oceanBlue ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm placeholder:text-slate-400",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
        spellcheck={false}
      />
    );
  },
});

export { Input };
