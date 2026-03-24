import { defineComponent, type PropType } from "vue";
import { cn } from "~/utilities/utils";

interface MotionDivProps {
  variants?: Record<string, unknown>;
  className?: string;
  initial?: boolean;
  animate?: boolean;
}

const defaultVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const MotionDiv = defineComponent({
  name: "MotionDiv",
  props: {
    variants: Object as PropType<MotionDivProps["variants"]>,
    className: String,
    initial: Boolean,
    animate: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { slots }) {
    return () => (
      <div
        class={cn(
          "transition-transform duration-300 ease-out",
          props.animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          props.className,
        )}
      >
        {slots.default?.()}
      </div>
    );
  },
});
