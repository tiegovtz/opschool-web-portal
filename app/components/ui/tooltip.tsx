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

type TooltipContextValue = {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
};

const tooltipContextKey = Symbol("tooltip-context");

const useTooltipContext = () => {
  const context = inject<TooltipContextValue | null>(tooltipContextKey, null);
  if (!context) {
    throw new Error("Tooltip components must be used within <Tooltip>.");
  }
  return context;
};

const TooltipProvider = defineComponent({
  name: "TooltipProvider",
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

const Tooltip = defineComponent({
  name: "Tooltip",
  inheritAttrs: false,
  props: {
    open: {
      type: Boolean,
      default: undefined,
    },
    defaultOpen: Boolean,
    onOpenChange: Function as PropType<(open: boolean) => void>,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const internalOpen = ref(Boolean(props.defaultOpen));
    const isControlled = computed(() => props.open !== undefined);
    const open = computed({
      get: () => (isControlled.value ? Boolean(props.open) : internalOpen.value),
      set: (value: boolean) => {
        if (!isControlled.value) {
          internalOpen.value = value;
        }
        props.onOpenChange?.(value);
      },
    });

    provide<TooltipContextValue>(tooltipContextKey, {
      open,
      setOpen: (value) => {
        open.value = value;
      },
    });

    return () => (
      <div
        {...attrs}
        class={cn(
          "relative inline-flex",
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

const TooltipTrigger = defineComponent({
  name: "TooltipTrigger",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = useTooltipContext();

    const sharedProps = {
      ...attrs,
      class: cn(
        props.class,
        props.className,
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
      ),
      onMouseenter: (event: MouseEvent) => {
        (attrs.onMouseenter as ((event: MouseEvent) => void) | undefined)?.(event);
        context.setOpen(true);
      },
      onMouseleave: (event: MouseEvent) => {
        (attrs.onMouseleave as ((event: MouseEvent) => void) | undefined)?.(event);
        context.setOpen(false);
      },
      onFocus: (event: FocusEvent) => {
        (attrs.onFocus as ((event: FocusEvent) => void) | undefined)?.(event);
        context.setOpen(true);
      },
      onBlur: (event: FocusEvent) => {
        (attrs.onBlur as ((event: FocusEvent) => void) | undefined)?.(event);
        context.setOpen(false);
      },
    };

    return () =>
      props.asChild ? (
        <span {...sharedProps}>{slots.default?.()}</span>
      ) : (
        <button type="button" {...sharedProps}>
          {slots.default?.()}
        </button>
      );
  },
});

const TooltipContent = defineComponent({
  name: "TooltipContent",
  inheritAttrs: false,
  props: {
    sideOffset: {
      type: Number,
      default: 4,
    },
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = useTooltipContext();

    return () =>
      context.open.value ? (
        <div
          {...attrs}
          class={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 overflow-hidden rounded-xl border border-oceanBlue/10 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-md",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          style={{ marginBottom: `${props.sideOffset}px` }}
        >
          {slots.default?.()}
        </div>
      ) : null;
  },
});

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
