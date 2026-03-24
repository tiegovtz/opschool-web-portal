import { defineComponent, type PropType } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";

export const Checkbox = defineComponent({
  name: "Checkbox",
  inheritAttrs: false,
  props: {
    checked: Boolean,
    modelValue: Boolean,
    disabled: Boolean,
    class: String,
    className: String,
    onCheckedChange: Function as PropType<(checked: boolean) => void>,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit }) {
    const handleChange = (event: Event) => {
      const value = (event.target as HTMLInputElement).checked;
      emit("update:modelValue", value);
      props.onCheckedChange?.(value);
    };

    return () => {
      const checked = props.modelValue ?? props.checked ?? false;

      return (
        <label
          class={cn(
            "relative inline-flex h-4 w-4 cursor-pointer items-center justify-center overflow-hidden rounded border border-oceanBlue/40 bg-white shadow-sm transition",
            checked ? "bg-oceanBlue text-white" : "text-transparent",
            props.disabled ? "cursor-not-allowed opacity-50" : "",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
        >
          <input
            {...attrs}
            checked={checked}
            disabled={props.disabled}
            type="checkbox"
            class="sr-only"
            onChange={handleChange}
          />
          <Icon icon="lucide:check" class="h-3.5 w-3.5" />
        </label>
      );
    };
  },
});
