// components/Draggable.tsx
import { defineComponent, ref, computed, type CSSProperties, type PropType} from "vue"
import { useDraggable } from "@vueuse/core"

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
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<DraggableData> },
    resize: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    style: { type: Object as PropType<CSSProperties> },
  },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null)
    const position = ref({ x: 0, y: 0 })

    // VueUse draggable
    useDraggable(element, {
      disabled: props.disabled,
      onMove: ({ x,y }) => {
        position.value.x += x;
        position.value.y += y;
      },
    })

    const transformStyle = computed(() => {
      if (!props.resize) {
        return `translate(${position.value.x}px, ${position.value.y}px)`
      }
      // Optional: scale/resize transform logic if you want to implement
      return `translate(${position.value.x}px, ${position.value.y}px)`
    })

    return () => (
      <div
        ref={element}
        style={{
          touchAction: props.disabled ? "auto" : "none",
          transform: transformStyle.value,
          ...props.style,
        }}
        id={props.id}
      >
        {slots.default?.()}
      </div>
    )
  },
})