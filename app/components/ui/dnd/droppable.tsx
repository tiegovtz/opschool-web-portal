import { computed, defineComponent, inject } from "vue";
import { cn } from "~/utilities/utils";
import { dndContextKey, type DndContextValue } from "~/components/layout/dnd-context";

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
    const dndContext = inject<DndContextValue | null>(dndContextKey, null);
    const droppableId = computed(() => String(props.id));
    const isDropTarget = computed(
      () => !props.disabled && dndContext?.activeId.value !== null,
    );

    const className = computed(() =>
      cn(
        attrs.class as string,
        !props.disabled && isDropTarget.value && props.isOverClassName
      )
    );

    const handleDragOver = (event: DragEvent) => {
      if (props.disabled) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (props.disabled) return;
      event.preventDefault();
      const draggedId = event.dataTransfer?.getData("text/plain") || undefined;
      dndContext?.completeDrop(droppableId.value, draggedId);
    };

    return () => (
      <div
        {...attrs}
        id={droppableId.value}
        class={className.value}
        onDragover={handleDragOver}
        onDrop={handleDrop}
      >
        {slots.default?.()}
      </div>
    );
  },
});
