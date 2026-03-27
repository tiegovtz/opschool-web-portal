import { defineComponent, type PropType } from "vue";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utilities/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border border-gray-200 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 dark:border-gray-800 dark:[&>svg]:text-gray-50",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50",
        destructive:
          "border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = defineComponent({
  name: "Alert",
  inheritAttrs: false,
  props: {
    variant: {
      type: String as PropType<VariantProps<typeof alertVariants>["variant"]>,
      default: "default",
    },
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <div
        {...attrs}
        role="alert"
        class={cn(
          alertVariants({ variant: props.variant }),
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

const AlertTitle = defineComponent({
  name: "AlertTitle",
  inheritAttrs: false,
  props: {
    class: String,
    className: String,
  },
  setup(props, { attrs, slots }) {
    return () => (
      <h5
        {...attrs}
        class={cn(
          "mb-1 font-medium leading-none tracking-tight",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        {slots.default?.()}
      </h5>
    );
  },
});

const AlertDescription = defineComponent({
  name: "AlertDescription",
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
          "text-sm [&_p]:leading-relaxed",
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

export { Alert, AlertTitle, AlertDescription };
