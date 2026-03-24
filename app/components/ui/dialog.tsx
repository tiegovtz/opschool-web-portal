import {
  Teleport,
  computed,
  defineComponent,
  inject,
  provide,
  ref,
  type PropType,
  type Ref,
} from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";

type DialogContextValue = {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
};

const dialogContextKey = Symbol("dialog-context");

const useDialogContext = () => {
  const context = inject<DialogContextValue | null>(dialogContextKey, null);
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog>.");
  }
  return context;
};

const Dialog = defineComponent({
  name: "Dialog",
  props: {
    open: Boolean,
    defaultOpen: Boolean,
    onOpenChange: Function as PropType<(open: boolean) => void>,
  },
  setup(props, { slots }) {
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

    provide<DialogContextValue>(dialogContextKey, {
      open,
      setOpen: (value) => {
        open.value = value;
      },
    });

    return () => slots.default?.();
  },
});

const DialogTrigger = defineComponent({
  name: "DialogTrigger",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useDialogContext();

    const handleClick = (event: MouseEvent) => {
      (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      dialog.setOpen(true);
    };

    return () => {
      const content = slots.default?.();
      const className = cn(
        props.class,
        props.className,
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
      );

      if (props.asChild) {
        return (
          <span {...attrs} class={className} onClick={handleClick}>
            {content}
          </span>
        );
      }

      return (
        <button {...attrs} type="button" class={className} onClick={handleClick}>
          {content}
        </button>
      );
    };
  },
});

const DialogPortal = defineComponent({
  name: "DialogPortal",
  setup(_, { slots }) {
    return () => <Teleport to="body">{slots.default?.()}</Teleport>;
  },
});

const DialogOverlay = defineComponent({
  name: "DialogOverlay",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs }) {
    const dialog = useDialogContext();
    return () =>
      dialog.open.value ? (
        <div
          {...attrs}
          class={cn(
            "fixed inset-0 z-50 bg-black/80",
            props.class,
            props.className,
            attrs.class as string | undefined,
            (attrs as { className?: string }).className,
          )}
          onClick={() => dialog.setOpen(false)}
        />
      ) : null;
  },
});

const DialogClose = defineComponent({
  name: "DialogClose",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useDialogContext();
    const handleClick = (event: MouseEvent) => {
      (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      dialog.setOpen(false);
    };

    return () => {
      const className = cn(
        props.class,
        props.className,
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
      );

      if (props.asChild) {
        return (
          <span {...attrs} class={className} onClick={handleClick}>
            {slots.default?.()}
          </span>
        );
      }

      return (
        <button {...attrs} type="button" class={className} onClick={handleClick}>
          {slots.default?.()}
        </button>
      );
    };
  },
});

const DialogContent = defineComponent({
  name: "DialogContent",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useDialogContext();

    return () =>
      dialog.open.value ? (
        <DialogPortal>
          <DialogOverlay />
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              {...attrs}
              class={cn(
                "relative grid w-full max-w-lg gap-4 rounded-2xl border border-oceanBlue/10 bg-white p-6 shadow-lg",
                props.class,
                props.className,
                attrs.class as string | undefined,
                (attrs as { className?: string }).className,
              )}
              onClick={(event: MouseEvent) => event.stopPropagation()}
            >
              {slots.default?.()}
              <DialogClose class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
                <Icon icon="lucide:x" class="h-4 w-4" />
                <span class="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
        </DialogPortal>
      ) : null;
  },
});

const DialogHeader = defineComponent({
  name: "DialogHeader",
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
          "flex flex-col space-y-1.5 text-center sm:text-left",
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

const DialogFooter = defineComponent({
  name: "DialogFooter",
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
          "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
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

const DialogTitle = defineComponent({
  name: "DialogTitle",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <h2
        {...attrs}
        class={cn(
          "text-lg font-semibold leading-none tracking-tight",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </h2>
    );
  },
});

const DialogDescription = defineComponent({
  name: "DialogDescription",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <p
        {...attrs}
        class={cn(
          "text-sm text-slate-500",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </p>
    );
  },
});

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  useDialogContext,
};
