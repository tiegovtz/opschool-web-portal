import { computed, defineComponent, inject, type CSSProperties, type PropType } from "vue";
import { cn } from "~/utilities/utils";
import { dndContextKey, type DndContextValue } from "~/components/layout/dnd-context";

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
    role: String,
    tabindex: [String, Number],
    onClick: Function as PropType<(event: MouseEvent) => void>,
    onKeydown: Function as PropType<(event: KeyboardEvent) => void>,
  },
  setup(props, { slots, attrs }) {
    const dndContext = inject<DndContextValue | null>(dndContextKey, null);
    const dragId = computed(() => String(props.id));
    const isDragging = computed(() => dndContext?.activeId.value === dragId.value);
    const className = computed(() =>
      cn(
        !props.disabled && "select-none [&_*]:select-none",
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
      )
    );
    const style = computed<CSSProperties>(() => ({
      touchAction: props.disabled ? "auto" : "none",
      ...(props.disabled
        ? {}
        : {
            userSelect: "none",
            WebkitUserSelect: "none",
          }),
      ...(isDragging.value
        ? {
            zIndex: 9999,
            position: "relative" as const,
          }
        : {}),
    }));

    const handleDragStart = (event: DragEvent) => {
      if (props.disabled) return;
      event.dataTransfer?.setData("text/plain", dragId.value);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
      }
      dndContext?.beginDrag(dragId.value);
    };

    const handleDragEnd = () => {
      // Defer so the droppable's drop (same gesture) runs first and can read activeId / dataTransfer.
      queueMicrotask(() => {
        dndContext?.endDrag();
      });
    };

    return () => (
      <div
        {...attrs}
        id={dragId.value}
        draggable={!props.disabled}
        role={props.role}
        tabindex={props.tabindex}
        onClick={props.onClick}
        onKeydown={props.onKeydown}
        onDragstart={handleDragStart}
        onDragend={handleDragEnd}
        style={style.value}
        class={className.value}
      >
        {slots.default?.()}
      </div>
    );
  },
});
