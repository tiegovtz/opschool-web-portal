import { defineComponent } from "vue";
import { cn } from "~/utilities/utils";

export default defineComponent({
  name: "Heading",
  props: {
    class: String,
    className: String,
  },
  setup(props, { slots }) {
    return () => (
      <h1
        class={cn(
          "text-3xl font-bold text-oceanBlue",
          props.class,
          props.className,
        )}
      >
        {slots.default?.()}
      </h1>
    );
  },
});
