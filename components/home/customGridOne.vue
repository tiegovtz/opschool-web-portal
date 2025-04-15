<script setup>
import { layoutEffect } from "~/utilities/controlls";

</script>

<template>
    <div v-trusted :class="[
        'grid grid-cols-1 gap-4 my-5 transition-all duration-500 ease-in-out',
        layoutEffect == 'grid' ? ' md:grid-cols-2 3xl:grid-cols-4 2xl:grid-cols-3' : '',
    ]">
        <slot name="data"/>
    </div>
</template>