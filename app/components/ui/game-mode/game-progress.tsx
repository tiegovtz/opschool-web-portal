// @ts-nocheck
import { defineComponent, PropType } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";

export interface GameProgressItem {
  id: string | number;
  isCompleted: boolean;
  isCorrect?: boolean;
  isCurrent?: boolean;
  label?: string;
  timeSpent?: number;
}

export default defineComponent({
  name: "GameProgress",

  props: {
    items: {
      type: Array as PropType<GameProgressItem[]>,
      required: true,
    },
    showLabels: {
      type: Boolean,
      default: false,
    },
    showTimeSpent: {
      type: Boolean,
      default: false,
    },
    className: {
      type: String,
      default: "",
    },
    itemClassName: {
      type: String,
      default: "",
    },
  },

  setup(props) {
    return () => (
      <div class={cn("flex items-center justify-center gap-4", props.className)}>
        {props.items.map((item, index) => {
          const {
            id,
            isCompleted,
            isCorrect,
            isCurrent,
            label,
            timeSpent,
          } = item;

          return (
            <div key={id} class="flex flex-col items-center gap-1">
              {/* Progress Item */}
              <div
                class={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                  {
                    "bg-green-100 border-2 border-green-300":
                      isCompleted && isCorrect,
                    "bg-red-100 border-2 border-red-300":
                      isCompleted && !isCorrect,
                    "bg-picton-blue-200": !isCompleted && !isCurrent,
                    "bg-picton-blue-100 border-2 border-picton-blue-500 shadow-md":
                      isCurrent && !isCompleted,
                  },
                  props.itemClassName,
                )}
              >
                {isCompleted ? (
                  isCorrect ? (
                    <Icon icon="mdi:check" class="text-green-600" width="20" />
                  ) : (
                    <Icon icon="mdi:close" class="text-red-600" width="20" />
                  )
                ) : (
                  <span
                    class={cn("text-sm font-medium", {
                      "text-picton-blue-700": isCurrent,
                      "text-gray-500": !isCurrent,
                    })}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              {props.showLabels && label && (
                <div class="text-xs text-gray-600 text-center">
                  {label}
                </div>
              )}

              {/* Time Spent */}
              {props.showTimeSpent &&
                timeSpent !== undefined &&
                isCompleted && (
                  <div class="flex items-center gap-1 text-xs text-gray-500">
                    <Icon icon="mdi:clock-outline" width="12" />
                    <span>{Math.round(timeSpent / 1000)}s</span>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    );
  },
});

export const createProgressItems = (
  completedItems: Set<number>,
  incorrectItems: Set<number>,
  currentIndex: number,
  totalItems: number,
  itemTimes?: Record<number, number>,
) => {
  return Array.from({ length: totalItems }, (_, index) => ({
    id: index,
    isCompleted: completedItems.has(index),
    isCorrect: completedItems.has(index) && !incorrectItems.has(index),
    isCurrent: index === currentIndex,
    timeSpent: itemTimes?.[index],
  }));
};