import { defineComponent, type PropType } from "vue";
import { cn } from "~/utilities/utils";

const Separator = defineComponent({
  name: "Separator",
  inheritAttrs: false,
  props: {
    orientation: {
      type: String as PropType<"horizontal" | "vertical">,
      default: "horizontal",
    },
    decorative: {
      type: Boolean,
      default: true,
    },
    class: String,
    className: String,
  },
  setup(props, { attrs }) {
    return () => (
      <div
        {...attrs}
        aria-hidden={props.decorative}
        class={cn(
          "shrink-0 bg-oceanBlue/12",
          props.orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      />
    );
  },
});

export { Separator };
