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

    const handleDragStart = (event: DragEvent) => {
      if (props.disabled) return;
      event.dataTransfer?.setData("text/plain", props.id);
      event.dataTransfer!.effectAllowed = "move";
      dndContext?.beginDrag(props.id);
      dndContext?.notifyDragStart(event, props.id);
    };

    const handleDrag = (event: DragEvent) => {
      if (props.disabled) return;
      dndContext?.notifyDragMove(event, props.id);
    };

    const handleDragEnd = () => {
      // Defer so the droppable's drop (same gesture) runs first and can read activeId / dataTransfer.
      queueMicrotask(() => {
        dndContext?.endDrag();
      });
    };

    return () => (
      <div
        {...draggable.value} 
        id={String(props.id)}
        style={style.value}
        {...attrs}
        draggable={!props.disabled}
        onDragstart={handleDragStart}
        onDrag={handleDrag}
        onDragend={handleDragEnd}
        style={{
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
          ...props.style,
        }}
        class={cn(
          !props.disabled && "select-none [&_*]:select-none",
          props.class,
          props.className,
          attrs.class as string | undefined,
          (attrs as { className?: string }).className,
        )}
        id={props.id}
      >
        {slots.default?.()}
      </div>
    );
  },
});