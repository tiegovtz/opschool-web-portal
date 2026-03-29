// components/Draggable.tsx
import {
  defineComponent,
  inject,
  type CSSProperties,
  type PropType,
} from "vue";
import { cn } from "~/utilities/utils";
import { dndContextKey, type DndContextValue } from "~/components/layout/dnd-context";

interface DraggableData {
  [key: string]: any
}

export interface DraggableProps {
  id: string
  data?: DraggableData
  resize?: boolean
  disabled?: boolean
  style?: CSSProperties
}

export default defineComponent({
  name: "Draggable",
  inheritAttrs: false,
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<DraggableData> },
    resize: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    style: { type: Object as PropType<CSSProperties> },
    className: String,
    class: String,
  },
  setup(props, { attrs, slots }) {
    const dndContext = inject<DndContextValue | null>(dndContextKey, null);

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
      dndContext?.endDrag();
    };

    return () => (
      <div
        {...attrs}
        draggable={!props.disabled}
        onDragstart={handleDragStart}
        onDrag={handleDrag}
        onDragend={handleDragEnd}
        style={{
          touchAction: props.disabled ? "auto" : "none",
          ...props.style,
        }}
        class={cn(
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
