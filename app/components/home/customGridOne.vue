<script setup lang="ts">
import type { tabs } from "~/types/types.data";
import { layoutEffect } from "~/utilities/controlls";
defineProps<{ activeTab?: tabs }>()
</script>

<template>
    <div :class="[
        'grid gap-3 my-5 transition-all duration-500 ease-in-out md:gap-4',
        activeTab === 'subjects' || activeTab === 'interactive-contents' ? 'grid-cols-2' : 'grid-cols-1',
        layoutEffect == 'grid' ? ` md:grid-cols-2  xl:grid-cols-3 2xl:grid-cols-4` : '',
    ]">
        <slot name="data" />
    </div>
</template>
