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
import { cn } from "~/utilities/utils";
import { buttonVariants } from "~/components/ui/button";

type AlertDialogContextValue = {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
};

const alertDialogContextKey = Symbol("alert-dialog-context");

const useAlertDialogContext = () => {
  const context = inject<AlertDialogContextValue | null>(
    alertDialogContextKey,
    null,
  );
  if (!context) {
    throw new Error("AlertDialog components must be used within <AlertDialog>.");
  }
  return context;
};

const AlertDialog = defineComponent({
  name: "AlertDialog",
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

    provide<AlertDialogContextValue>(alertDialogContextKey, {
      open,
      setOpen: (value) => {
        open.value = value;
      },
    });

    return () => slots.default?.();
  },
});

const AlertDialogTrigger = defineComponent({
  name: "AlertDialogTrigger",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useAlertDialogContext();
    const handleClick = (event: MouseEvent) => {
      (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      dialog.setOpen(true);
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

const AlertDialogPortal = defineComponent({
  name: "AlertDialogPortal",
  setup(_, { slots }) {
    return () => <Teleport to="body">{slots.default?.()}</Teleport>;
  },
});

const AlertDialogOverlay = defineComponent({
  name: "AlertDialogOverlay",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs }) {
    const dialog = useAlertDialogContext();
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
        />
      ) : null;
  },
});

const AlertDialogContent = defineComponent({
  name: "AlertDialogContent",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useAlertDialogContext();

    return () =>
      dialog.open.value ? (
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              {...attrs}
              class={cn(
                "grid w-full max-w-lg gap-4 rounded-2xl border border-oceanBlue/10 bg-white p-6 shadow-lg",
                props.class,
                props.className,
                attrs.class as string | undefined,
                (attrs as { className?: string }).className,
              )}
            >
              {slots.default?.()}
            </div>
          </div>
        </AlertDialogPortal>
      ) : null;
  },
});

const AlertDialogHeader = defineComponent({
  name: "AlertDialogHeader",
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
          "flex flex-col space-y-2 text-center sm:text-left",
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

const AlertDialogFooter = defineComponent({
  name: "AlertDialogFooter",
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

const AlertDialogTitle = defineComponent({
  name: "AlertDialogTitle",
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
          "text-lg font-semibold",
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

const AlertDialogDescription = defineComponent({
  name: "AlertDialogDescription",
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

const AlertDialogAction = defineComponent({
  name: "AlertDialogAction",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useAlertDialogContext();
    const handleClick = (event: MouseEvent) => {
      (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      dialog.setOpen(false);
    };

    return () => (
      <button
        {...attrs}
        type="button"
        class={cn(
          buttonVariants(),
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

const AlertDialogCancel = defineComponent({
  name: "AlertDialogCancel",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useAlertDialogContext();
    const handleClick = (event: MouseEvent) => {
      (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      dialog.setOpen(false);
    };

    return () => (
      <button
        {...attrs}
        type="button"
        class={cn(
          buttonVariants({ variant: "outline" }),
          "mt-2 sm:mt-0",
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

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
