import { defineComponent, provide, ref } from "vue";
import {
  startDragAutoScroll,
  stopDragAutoScroll,
} from "~/utilities/dragAutoScroll";

export const dndContextKey = Symbol("dnd-context");

export interface DndDragEndEvent {
  active: { id: string };
  over?: { id: string };
}

export interface DndContextValue {
  activeId: ReturnType<typeof ref<string | null>>;
  beginDrag: (id: string) => void;
  endDrag: () => void;
  /** Pass draggedId from dataTransfer when drop fires so a late dragend cannot clear activeId first. */
  completeDrop: (overId: string, draggedId?: string) => void;
}

export default defineComponent({
  name: "DNDContext",
  props: {
    onDragEnd: Function,
  },
  setup(props, { slots }) {
    const activeId = ref<string | null>(null);

    const beginDrag = (id: string) => {
      activeId.value = id;
      startDragAutoScroll();
    };

    const endDrag = () => {
      stopDragAutoScroll();
      activeId.value = null;
    };

    const completeDrop = (overId: string, draggedId?: string) => {
      const id = draggedId || activeId.value;
      if (!id) return;

      props.onDragEnd?.({
        active: { id },
        over: { id: overId },
      } satisfies DndDragEndEvent);
      stopDragAutoScroll();
      activeId.value = null;
    };

    provide<DndContextValue>(dndContextKey, {
      activeId,
      beginDrag,
      endDrag,
      completeDrop,
    });

    return () => <div>{slots.default?.()}</div>;
  },
});
