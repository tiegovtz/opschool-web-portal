<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
  active?: boolean;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

const props = defineProps<Props>();
</script>

<template>
  <nav
    :class="cn('flex items-center space-x-2 text-sm', props.className)"
    aria-label="Breadcrumb navigation"
  >
    <div class="flex items-center space-x-1 rounded-full bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md">
      <Icon icon="lucide:house" width="14" height="14" class="text-picton-blue-600" />
    </div>

    <div
      v-for="(item, index) in props.items"
      :key="`${item.label}-${index}`"
      class="flex items-center space-x-2"
    >
      <Icon icon="lucide:chevron-right" width="14" height="14" class="text-gray-400" />

      <button
        v-if="item.onClick"
        type="button"
        :class="
          cn(
            'rounded-full px-3 py-1.5 font-medium transition-all duration-200',
            item.active
              ? 'bg-picton-blue-100 text-picton-blue-800 shadow-sm'
              : 'text-gray-600 backdrop-blur-sm hover:bg-white/40 hover:text-picton-blue-700',
          )
        "
        @click="item.onClick()"
      >
        {{ item.label }}
      </button>

      <span
        v-else
        :class="
          cn(
            'rounded-full px-3 py-1.5 font-medium',
            item.active ? 'bg-picton-blue-600 text-white shadow-md' : 'text-gray-500',
          )
        "
      >
        {{ item.label }}
      </span>
    </div>
  </nav>
</template>
