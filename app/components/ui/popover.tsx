import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type PropType,
  type Ref,
} from "vue";
import { cn } from "~/utilities/utils";

type PopoverContextValue = {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
};

const popoverContextKey = Symbol("popover-context");

const usePopoverContext = () => {
  const context = inject<PopoverContextValue | null>(popoverContextKey, null);
  if (!context) {
    throw new Error("Popover components must be used within <Popover>.");
  }
  return context;
};

const Popover = defineComponent({
  name: "Popover",
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
    const rootRef = ref<HTMLElement | null>(null);
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

    provide<PopoverContextValue>(popoverContextKey, {
      open,
      setOpen: (value) => {
        open.value = value;
      },
    });

    return () => (
      <div
        {...attrs}
        ref={rootRef}
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

const PopoverTrigger = defineComponent({
  name: "PopoverTrigger",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = usePopoverContext();

    const handleClick = (event: MouseEvent) => {
      (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      context.setOpen(!context.open.value);
    };

    return () =>
      props.asChild ? (
        <span
          {...attrs}
          class={cn(
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          onClick={handleClick}
        >
          {slots.default?.()}
        </span>
      ) : (
        <button
          {...attrs}
          type="button"
          class={cn(
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          onClick={handleClick}
        >
          {slots.default?.()}
        </button>
      );
  },
});

const PopoverContent = defineComponent({
  name: "PopoverContent",
  inheritAttrs: false,
  props: {
    align: {
      type: String as PropType<"start" | "center" | "end">,
      default: "center",
    },
    sideOffset: {
      type: Number,
      default: 4,
    },
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const context = usePopoverContext();

    const alignmentClasses: Record<"start" | "center" | "end", string> = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    };

    return () =>
      context.open.value ? (
        <div
          {...attrs}
          class={cn(
            "absolute z-50 w-72 rounded-2xl border border-oceanBlue/10 bg-white p-4 text-slate-700 shadow-lg outline-none",
            alignmentClasses[props.align],
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          style={{ top: `calc(100% + ${props.sideOffset}px)` }}
        >
          {slots.default?.()}
        </div>
      ) : null;
  },
});

export { Popover, PopoverTrigger, PopoverContent };
