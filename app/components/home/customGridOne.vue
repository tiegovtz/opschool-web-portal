<script setup lang="ts">
import type { tabs } from "~/types/types.data";
import { layoutEffect } from "~/utilities/controlls";
defineProps<{ activeTab?: tabs }>()
</script>

<template>
    <div :class="[
        'grid grid-cols-1 gap-4 my-5 transition-all duration-500 ease-in-out ',
        layoutEffect == 'grid' ? ` md:grid-cols-2  xl:grid-cols-3 2xl:grid-cols-4` : '',
    ]">
        <slot name="data" />
    </div>
</template>
