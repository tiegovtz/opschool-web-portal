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
    const onDragEnter = (e: DragEvent) => {
      if (!props.disabled) {
        e.preventDefault();
      }
    };

    const onDragOver = (e: DragEvent) => {
      if (!props.disabled) {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "move";
        }
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
      const fromTransfer = e.dataTransfer?.getData("text/plain")?.trim() || "";
      if (!fromTransfer && !dndContext?.activeId.value) return;
      dndContext?.completeDrop(
        props.id,
        fromTransfer ? fromTransfer : undefined,
      );
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
        id={props.id}
        class={classList.value}
        onDragenter={onDragEnter}
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
