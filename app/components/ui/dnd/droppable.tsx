import { defineComponent, computed } from "vue";
import { useDroppable } from "@dnd-kit/vue";
import { cn } from "~/utilities/utils";


export default defineComponent({
  name: "Droppable",
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
    data: {
      type: Object,
      default: undefined,
    },
    isOverClassName: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots, attrs }) {
    const { droppable, isDropTarget } = useDroppable({
      id: props.id,
      data: props.data,
      disabled: props.disabled,
    });

    const className = computed(() =>
      cn(
        attrs.class as string,
        !props.disabled && isDropTarget.value && props.isOverClassName
      )
    );

    return () => (
      <div
        {...droppable.value} 
        id={String(props.id)}
        class={className.value}
        {...attrs}
      >
        {slots.default?.()}
      </div>
    );
  },
});