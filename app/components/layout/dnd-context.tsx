import { defineComponent, provide, ref } from "vue";

export const dndContextKey = Symbol("dnd-context");

export interface DndDragEndEvent {
  active: { id: string };
  over?: { id: string };
}

export interface DndContextValue {
  activeId: ReturnType<typeof ref<string | null>>;
  beginDrag: (id: string) => void;
  endDrag: () => void;
  completeDrop: (overId?: string) => void;
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
    };

    const endDrag = () => {
      activeId.value = null;
    };

    const completeDrop = (overId?: string) => {
      if (!activeId.value) return;

      props.onDragEnd?.({
        active: { id: activeId.value },
        over: overId ? { id: overId } : undefined,
      } satisfies DndDragEndEvent);
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
