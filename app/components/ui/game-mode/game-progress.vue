<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { GameProgressItem } from "./types";
import { cn } from "~/utilities/utils";

type GameProgressProps = {
  items: GameProgressItem[];
  showLabels?: boolean;
  showTimeSpent?: boolean;
  className?: string;
  itemClassName?: string;
};

const props = withDefaults(defineProps<GameProgressProps>(), {
  showLabels: false,
  showTimeSpent: false,
  className: "",
  itemClassName: "",
});
</script>

<template>
  <div :class="cn('flex items-center justify-center gap-4', props.className)">
    <div
      v-for="(item, index) in props.items"
      :key="item.id"
      class="flex flex-col items-center gap-1"
    >
      <div
        :class="
          cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
            {
              'border-2 border-green-300 bg-green-100': item.isCompleted && item.isCorrect,
              'border-2 border-red-300 bg-red-100': item.isCompleted && !item.isCorrect,
              'bg-picton-blue-200': !item.isCompleted && !item.isCurrent,
              'border-2 border-picton-blue-500 bg-picton-blue-100 shadow-md':
                item.isCurrent && !item.isCompleted,
            },
            props.itemClassName,
          )
        "
      >
        <template v-if="item.isCompleted">
          <Icon
            v-if="item.isCorrect"
            icon="mdi:check"
            class="text-green-600"
            :width="20"
            :height="20"
          />
          <Icon
            v-else
            icon="mdi:close"
            class="text-red-600"
            :width="20"
            :height="20"
          />
        </template>
        <span
          v-else
          :class="
            cn('text-sm font-medium', {
              'text-picton-blue-700': item.isCurrent,
              'text-gray-500': !item.isCurrent,
            })
          "
        >
          {{ index + 1 }}
        </span>
      </div>

      <div v-if="props.showLabels && item.label" class="text-center text-xs text-gray-600">
        {{ item.label }}
      </div>

      <div
        v-if="props.showTimeSpent && item.timeSpent !== undefined && item.isCompleted"
        class="flex items-center gap-1 text-xs text-gray-500"
      >
        <Icon icon="mdi:clock-outline" :width="10" :height="10" />
        <span>{{ Math.round(item.timeSpent / 1000) }}s</span>
      </div>
    </div>
  </div>
</template>
