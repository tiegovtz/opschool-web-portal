import { defineComponent } from "vue";
import { cn } from "~/utilities/utils";

const Skeleton = defineComponent({
  name: "Skeleton",
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
          "animate-pulse rounded-xl bg-sky-100",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      />
    );
  },
});

export { Skeleton };
