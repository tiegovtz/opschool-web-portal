import { defineComponent } from "vue";
import { cn } from "~/utilities/utils";

export default defineComponent({
  name: "NextImageShim",
  inheritAttrs: false,
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: "",
    },
    class: String,
    className: String,
    width: [String, Number],
    height: [String, Number],
  },
  setup(props, { attrs }) {
    return () => (
      <img
        {...attrs}
        src={props.src}
        alt={props.alt}
        width={props.width}
        height={props.height}
        class={cn(
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      />
    );
  },
});
