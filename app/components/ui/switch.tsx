import { computed, defineComponent, ref } from "vue";
import { cn } from "~/utilities/utils";

const Switch = defineComponent({
  name: "Switch",
  inheritAttrs: false,
  props: {
    checked: {
      type: Boolean,
      default: undefined,
    },
    modelValue: {
      type: Boolean,
      default: undefined,
    },
    defaultChecked: Boolean,
    disabled: Boolean,
    class: String,
    className: String,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit }) {
    const internalChecked = ref(Boolean(props.defaultChecked));

    const currentChecked = computed(() => {
      if (props.modelValue !== undefined) {
        return props.modelValue;
      }
      if (props.checked !== undefined) {
        return props.checked;
      }
      return internalChecked.value;
    });

    const toggle = () => {
      if (props.disabled) {
        return;
      }

      if (props.modelValue === undefined && props.checked === undefined) {
        internalChecked.value = !currentChecked.value;
      }

      emit("update:modelValue", !currentChecked.value);
      (attrs.onCheckedChange as ((value: boolean) => void) | undefined)?.(
        !currentChecked.value,
      );
    };

    return () => (
      <button
        {...attrs}
        type="button"
        role="switch"
        aria-checked={currentChecked.value}
        disabled={props.disabled}
        class={cn(
          "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/25 disabled:cursor-not-allowed disabled:opacity-50",
          currentChecked.value ? "bg-oceanBlue" : "bg-slate-200",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
        onClick={toggle}
      >
        <span
          class={cn(
            "block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            currentChecked.value ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    );
  },
});

export { Switch };
