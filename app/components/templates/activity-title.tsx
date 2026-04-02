import { defineComponent } from "vue";
import { cn } from "~/utilities/utils";

export default defineComponent({
  name: "ActivityTitle",
  props: {
    title: {
      type: String,
      default: "",
    },
    className: String,
  },
  setup(props, { slots }) {
    return () => (
      <div
        class={cn(
          "mb-4 rounded-2xl border border-oceanBlue/15 bg-white px-5 py-4 shadow-sm",
          props.className,
        )}
      >
        <h2 class="text-xl font-semibold tracking-tight text-oceanBlue md:text-2xl">
          {props.title || slots.default?.()}
        </h2>
      </div>
    );
  },
});
