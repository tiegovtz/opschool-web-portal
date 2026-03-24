// components/Droppable.tsx
import { defineComponent, ref, computed, type Slots } from "vue"
import { cn } from "~/utilities/utils"

export interface DroppableProps {
  id: string
  data?: Record<string, any>
  disabled?: boolean
  isOverClassName?: string
  className?: string
}

export default defineComponent({
  name: "Droppable",
  props: {
    id: { type: String, required: true },
    data: { type: Object as PropType<Record<string, any>> },
    disabled: { type: Boolean, default: false },
    isOverClassName: { type: String },
    className: { type: String },
  },
  setup(props, { slots }: { slots: Slots }) {
    const element = ref<HTMLElement | null>(null)
    const isOver = ref(false)

    // Track dragover / dragleave manually
    const onDragOver = (e: DragEvent) => {
      if (!props.disabled) {
        e.preventDefault() // required to allow drop
        isOver.value = true
      }
    }

    const onDragLeave = () => {
      if (!props.disabled) {
        isOver.value = false
      }
    }

    const onDrop = (e: DragEvent) => {
      isOver.value = false
      // Optional: access dropped data via e.dataTransfer
      // e.g., const data = e.dataTransfer?.getData('text')
    }

    // Combine className + isOverClassName using cn
    const classList = computed(() =>
      cn(props.className, !props.disabled && isOver.value && props.isOverClassName)
    )

    return () => (
      <div
        ref={element}
        class={classList.value}
        onDragover={onDragOver}
        onDragleave={onDragLeave}
        onDrop={onDrop}
        {...props} // spreads other native div props like style
      >
        {slots.default?.()}
      </div>
    )
  },
})