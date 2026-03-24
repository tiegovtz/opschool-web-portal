import { defineComponent, type PropType } from "vue";
import { Icon } from "@iconify/vue";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utilities/utils";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  useDialogContext,
} from "~/components/ui/dialog";

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border border-oceanBlue/10 bg-white p-6 text-slate-700 shadow-xl transition-all duration-300",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 rounded-b-3xl border-t-0",
        bottom: "inset-x-0 bottom-0 rounded-t-3xl border-b-0",
        left: "inset-y-0 left-0 h-full w-11/12 max-w-md rounded-r-3xl border-l-0",
        right:
          "inset-y-0 right-0 h-full w-11/12 max-w-md rounded-l-3xl border-r-0",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type SheetSide = NonNullable<VariantProps<typeof sheetVariants>["side"]>;

const Sheet = Dialog;
const SheetTrigger = DialogTrigger;
const SheetPortal = DialogPortal;

const SheetClose = defineComponent({
  name: "SheetClose",
  inheritAttrs: false,
  props: {
    asChild: Boolean,
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <DialogClose
        {...attrs}
        asChild={props.asChild}
        class={cn(
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </DialogClose>
    );
  },
});

const SheetOverlay = defineComponent({
  name: "SheetOverlay",
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
            "fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]",
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

const sidePositionClasses: Record<SheetSide, string> = {
  top: "items-start justify-center",
  bottom: "items-end justify-center",
  left: "items-center justify-start",
  right: "items-center justify-end",
};

const SheetContent = defineComponent({
  name: "SheetContent",
  inheritAttrs: false,
  props: {
    side: {
      type: String as PropType<SheetSide>,
      default: "right",
    },
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    const dialog = useDialogContext();

    return () =>
      dialog.open.value ? (
        <SheetPortal>
          <SheetOverlay />
          <div
            class={cn(
              "fixed inset-0 z-50 flex p-3 sm:p-4",
              sidePositionClasses[props.side],
            )}
          >
            <div
              {...attrs}
              class={cn(
                sheetVariants({ side: props.side }),
                props.class,
                props.className,
                attrs.class as string | undefined,
                (attrs as { className?: string }).className,
              )}
              onClick={(event: MouseEvent) => event.stopPropagation()}
            >
              {slots.default?.()}
              <SheetClose class="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-oceanBlue">
                <Icon icon="lucide:x" class="h-4 w-4" />
                <span class="sr-only">Close</span>
              </SheetClose>
            </div>
          </div>
        </SheetPortal>
      ) : null;
  },
});

const SheetHeader = defineComponent({
  name: "SheetHeader",
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

const SheetFooter = defineComponent({
  name: "SheetFooter",
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
          "mt-auto flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
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

const SheetTitle = defineComponent({
  name: "SheetTitle",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <DialogTitle
        {...attrs}
        class={cn(
          "text-lg font-semibold text-oceanBlue",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </DialogTitle>
    );
  },
});

const SheetDescription = defineComponent({
  name: "SheetDescription",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <DialogDescription
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
      </DialogDescription>
    );
  },
});

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
