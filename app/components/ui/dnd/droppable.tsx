// components/Droppable.tsx
import {
  defineComponent,
  inject,
  ref,
  computed,
  type PropType,
  type Slots,
  type CSSProperties,
} from "vue";
import { cn } from "~/utilities/utils";
import { dndContextKey, type DndContextValue } from "~/components/layout/dnd-context";

export interface DroppableProps {
  id: string
  data?: Record<string, any>
  disabled?: boolean
  isOverClassName?: string
  className?: string
}

export default defineComponent({
  name: "Droppable",
  inheritAttrs: false,
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<Record<string, any>> },
    disabled: { type: Boolean, default: false },
    isOverClassName: { type: String },
    className: { type: String },
  },
  setup(props, { attrs, slots }: { attrs: Record<string, unknown>; slots: Slots }) {
    const element = ref<HTMLElement | null>(null);
    const isOver = ref(false);
    const dndContext = inject<DndContextValue | null>(dndContextKey, null);

    // Track dragover / dragleave manually
    const onDragOver = (e: DragEvent) => {
      if (!props.disabled) {
        e.preventDefault();
        isOver.value = true;
      }
    };

    const onDragLeave = () => {
      if (!props.disabled) {
        isOver.value = false;
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      isOver.value = false;
      const droppedId = e.dataTransfer?.getData("text/plain") || dndContext?.activeId.value;
      if (droppedId) {
        dndContext?.completeDrop(props.id);
      }
    };

    // Combine className + isOverClassName using cn
    const classList = computed(() =>
      cn(
        props.className,
        attrs.class as string | undefined,
        (attrs as { className?: string }).className,
        !props.disabled && isOver.value && props.isOverClassName,
      ),
    );

    return () => (
      <div
        ref={element}
        class={classList.value}
        onDragover={onDragOver}
        onDragleave={onDragLeave}
        onDrop={onDrop}
        style={attrs.style as CSSProperties}
      >
        {slots.default?.()}
      </div>
    );
  },
});
