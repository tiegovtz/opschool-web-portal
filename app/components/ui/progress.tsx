import { computed, defineComponent } from "vue";
import { cn } from "~/utilities/utils";

const Progress = defineComponent({
  name: "Progress",
  inheritAttrs: false,
  props: {
    value: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    class: String,
    className: String,
  },
  setup(props, { attrs }) {
    const percentage = computed(() => {
      if (props.max <= 0) {
        return 0;
      }
      return Math.min(100, Math.max(0, (props.value / props.max) * 100));
    });

    return () => (
      <div
        {...attrs}
        role="progressbar"
        aria-valuemax={props.max}
        aria-valuemin={0}
        aria-valuenow={Math.min(props.max, Math.max(0, props.value))}
        class={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-sky-100",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
      >
        <div
          class="h-full rounded-full bg-oceanBlue transition-all duration-300 ease-out"
          style={{ width: `${percentage.value}%` }}
        />
      </div>
    );
  },
});

export { Progress };
