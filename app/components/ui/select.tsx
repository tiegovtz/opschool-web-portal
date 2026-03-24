import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  type PropType,
  type Ref,
  type VNode,
} from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";

type SelectSize = "sm" | "default";
type SelectVariant = "brand" | "default";

type SelectContextValue = {
  open: Ref<boolean>;
  value: Ref<string>;
  disabled: Ref<boolean>;
  placeholder: Ref<string | undefined>;
  selectedLabel: Ref<string>;
  setOpen: (value: boolean) => void;
  setValue: (value: string) => void;
  registerItem: (value: string, label: string) => void;
};

const selectContextKey = Symbol("select-context");

const useSelectContext = () => {
  const context = inject<SelectContextValue | null>(selectContextKey, null);
  if (!context) {
    throw new Error("Select components must be used within <Select>.");
  }
  return context;
};

const flattenText = (nodes: VNode[] | undefined): string => {
  if (!nodes) {
    return "";
  }

  return nodes
    .map((node) => {
      if (typeof node.children === "string") {
        return node.children;
      }
      if (Array.isArray(node.children)) {
        return flattenText(node.children as VNode[]);
      }
      return "";
    })
    .join("")
    .trim();
};

const Select = defineComponent({
  name: "Select",
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: undefined,
    },
    defaultValue: {
      type: String,
      default: "",
    },
    disabled: Boolean,
    open: {
      type: Boolean,
      default: undefined,
    },
    onValueChange: Function as PropType<(value: string) => void>,
    onOpenChange: Function as PropType<(open: boolean) => void>,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const rootRef = ref<HTMLElement | null>(null);
    const internalOpen = ref(false);
    const internalValue = ref(props.defaultValue ?? "");
    const labels = reactive(new Map<string, string>());

    const isOpenControlled = computed(() => props.open !== undefined);
    const isValueControlled = computed(() => props.value !== undefined);

    const open = computed({
      get: () => (isOpenControlled.value ? Boolean(props.open) : internalOpen.value),
      set: (value: boolean) => {
        if (!isOpenControlled.value) {
          internalOpen.value = value;
        }
        props.onOpenChange?.(value);
      },
    });

    const value = computed({
      get: () => (isValueControlled.value ? props.value ?? "" : internalValue.value),
      set: (nextValue: string) => {
        if (!isValueControlled.value) {
          internalValue.value = nextValue;
        }
        props.onValueChange?.(nextValue);
      },
    });

    const selectedLabel = computed(() => labels.get(value.value) ?? value.value);

    const handleOutsideClick = (event: MouseEvent) => {
      if (!open.value || !rootRef.value) {
        return;
      }

      if (!rootRef.value.contains(event.target as Node)) {
        open.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("mousedown", handleOutsideClick);
    });

    provide<SelectContextValue>(selectContextKey, {
      open,
      value,
      disabled: computed(() => props.disabled),
      placeholder: ref(undefined),
      selectedLabel,
      setOpen: (nextValue) => {
        open.value = nextValue;
      },
      setValue: (nextValue) => {
        value.value = nextValue;
        open.value = false;
      },
      registerItem: (itemValue, label) => {
        labels.set(itemValue, label);
      },
    });

    return () => (
      <div
        {...attrs}
        ref={rootRef}
        class={cn(
          "relative inline-flex w-full flex-col",
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

const SelectGroup = defineComponent({
  name: "SelectGroup",
  setup(_, { slots }) {
    return () => <div class="space-y-1">{slots.default?.()}</div>;
  },
});

const SelectValue = defineComponent({
  name: "SelectValue",
  inheritAttrs: false,
  props: {
    placeholder: String,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = useSelectContext();

    return () => {
      const rendered = slots.default?.();
      const content =
        rendered && rendered.length > 0
          ? rendered
          : context.selectedLabel.value || props.placeholder || "Select an option";

      return (
        <span
          {...attrs}
          class={cn(
            "line-clamp-1 flex items-center gap-2",
            !context.value.value && "text-slate-400",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
        >
          {content}
        </span>
      );
    };
  },
});

const SelectTrigger = defineComponent({
  name: "SelectTrigger",
  inheritAttrs: false,
  props: {
    size: {
      type: String as PropType<SelectSize>,
      default: "default",
    },
    variant: {
      type: String as PropType<SelectVariant>,
      default: "brand",
    },
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = useSelectContext();

    return () => (
      <button
        {...attrs}
        type="button"
        disabled={context.disabled.value}
        data-size={props.size}
        class={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          props.variant === "brand"
            ? "border-oceanBlue/20 bg-sky-50 text-oceanBlue focus-visible:ring-2 focus-visible:ring-oceanBlue/25"
            : "border-slate-200 bg-white text-slate-700 focus-visible:ring-2 focus-visible:ring-oceanBlue/20",
          props.size === "sm" ? "h-8" : "h-10",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
        onClick={() => {
          if (!context.disabled.value) {
            context.setOpen(!context.open.value);
          }
        }}
      >
        <span class="min-w-0 flex-1 text-left">{slots.default?.()}</span>
        <Icon icon="lucide:chevron-down" class="h-4 w-4 shrink-0 opacity-60" />
      </button>
    );
  },
});

const SelectScrollUpButton = defineComponent({
  name: "SelectScrollUpButton",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <div
        {...attrs}
        class={cn(
          "flex items-center justify-center py-1 text-slate-400",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.() || <Icon icon="lucide:chevron-up" class="h-4 w-4" />}
      </div>
    );
  },
});

const SelectScrollDownButton = defineComponent({
  name: "SelectScrollDownButton",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <div
        {...attrs}
        class={cn(
          "flex items-center justify-center py-1 text-slate-400",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.() || <Icon icon="lucide:chevron-down" class="h-4 w-4" />}
      </div>
    );
  },
});

const SelectContent = defineComponent({
  name: "SelectContent",
  inheritAttrs: false,
  props: {
    position: {
      type: String,
      default: "popper",
    },
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = useSelectContext();

    return () =>
      context.open.value ? (
        <div
          {...attrs}
          class={cn(
            "absolute left-0 top-[calc(100%+0.35rem)] z-50 max-h-52 min-w-full overflow-hidden rounded-2xl border border-oceanBlue/10 bg-white text-slate-700 shadow-lg",
            props.position === "popper" && "origin-top",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
        >
          <div class="max-h-52 overflow-y-auto p-1">{slots.default?.()}</div>
        </div>
      ) : null;
  },
});

const SelectLabel = defineComponent({
  name: "SelectLabel",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <div
        {...attrs}
        class={cn(
          "px-2 py-1.5 text-sm font-semibold text-oceanBlue",
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

const SelectItem = defineComponent({
  name: "SelectItem",
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
    const context = useSelectContext();

    return () => {
      const content = slots.default?.();
      const label = flattenText(content);
      if (label) {
        context.registerItem(props.value, label);
      }

      const isSelected = context.value.value === props.value;

      return (
        <button
          {...attrs}
          type="button"
          disabled={props.disabled}
          class={cn(
            "relative flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
            isSelected
              ? "bg-sky-50 text-oceanBlue"
              : "text-slate-700 hover:bg-slate-50",
            props.disabled && "cursor-not-allowed opacity-50",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          onClick={() => {
            if (!props.disabled) {
              context.setValue(props.value);
            }
          }}
        >
          <span class="mr-2 flex h-4 w-4 items-center justify-center">
            {isSelected ? (
              <Icon icon="lucide:check" class="h-4 w-4 text-oceanBlue" />
            ) : null}
          </span>
          <span class="min-w-0 flex-1">{content}</span>
        </button>
      );
    };
  },
});

const SelectSeparator = defineComponent({
  name: "SelectSeparator",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs }) {
    return () => (
      <div
        {...attrs}
        class={cn(
          "my-1 h-px bg-slate-100",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      />
    );
  },
});

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
