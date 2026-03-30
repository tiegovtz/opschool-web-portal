import { defineComponent, computed } from "vue";
import { useDraggable } from "@dnd-kit/vue";
import { CSS } from "@dnd-kit/utilities";

export default defineComponent({
  name: "Draggable",
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
    data: {
      type: Object,
      default: undefined,
    },
    resize: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots, attrs }) {
    const { draggable, isDragging } = useDraggable({
      id: props.id,
      data: props.data,
      disabled: props.disabled,
    });

    const style = computed(() => {
      const transform = draggable.value?.transform;

      const baseTransform = props.resize
        ? CSS.Transform.toString(transform)
        : `translate(${transform?.x || 0}px, ${transform?.y || 0}px)`;

      return {
        touchAction: props.disabled ? "auto" : "none",
        transform: baseTransform,
        ...(attrs.style as object),
      };
    });

    return () => (
      <div
        {...draggable.value} 
        id={String(props.id)}
        style={style.value}
        {...attrs}
      >
        {slots.default?.()}
      </div>
    );
  },
});