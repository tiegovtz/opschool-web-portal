import {
  computed,
  defineComponent,
  inject,
  provide,
  ref,
  type PropType,
  type Ref,
} from "vue";
import { cn } from "~/utilities/utils";

type RadioGroupContextValue = {
  value: Ref<string>;
  disabled: Ref<boolean>;
  setValue: (value: string) => void;
};

const radioGroupContextKey = Symbol("radio-group-context");

const useRadioGroupContext = () => {
  const context = inject<RadioGroupContextValue | null>(radioGroupContextKey, null);
  if (!context) {
    throw new Error("RadioGroupItem must be used within <RadioGroup>.");
  }
  return context;
};

const RadioGroup = defineComponent({
  name: "RadioGroup",
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: undefined,
    },
    modelValue: {
      type: String,
      default: undefined,
    },
    defaultValue: {
      type: String,
      default: "",
    },
    disabled: Boolean,
    class: String,
    className: String,
    onValueChange: Function as PropType<(value: string) => void>,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit, slots }) {
    const internalValue = ref(props.defaultValue ?? "");
    const currentValue = computed({
      get: () =>
        props.modelValue ?? props.value ?? internalValue.value ?? "",
      set: (nextValue: string) => {
        if (props.modelValue === undefined && props.value === undefined) {
          internalValue.value = nextValue;
        }
        emit("update:modelValue", nextValue);
        props.onValueChange?.(nextValue);
      },
    });

    provide<RadioGroupContextValue>(radioGroupContextKey, {
      value: currentValue,
      disabled: computed(() => props.disabled),
      setValue: (nextValue) => {
        currentValue.value = nextValue;
      },
    });

    return () => (
      <div
        {...attrs}
        role="radiogroup"
        class={cn(
          "grid gap-2",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </div>
    );
  },
});

const RadioGroupItem = defineComponent({
  name: "RadioGroupItem",
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      required: true,
    },
    disabled: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = useRadioGroupContext();

    return () => {
      const checked = context.value.value === props.value;
      const disabled = context.disabled.value || props.disabled;

      return (
        <button
          {...attrs}
          type="button"
          role="radio"
          aria-checked={checked}
          disabled={disabled}
          class={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border border-oceanBlue text-oceanBlue ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/25 disabled:cursor-not-allowed disabled:opacity-50",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          onClick={() => {
            if (!disabled) {
              context.setValue(props.value);
            }
          }}
        >
          <span
            class={cn(
              "h-2.5 w-2.5 rounded-full bg-oceanBlue transition-opacity",
              checked ? "opacity-100" : "opacity-0",
            )}
          />
          <span class="sr-only">{slots.default?.() || props.value}</span>
        </button>
      );
    };
  },
});

export { RadioGroup, RadioGroupItem };
