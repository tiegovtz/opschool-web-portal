<script setup lang="ts">
definePageMeta({ path: '/:educationLevel(primary|secondary)/adt' });
const route = useRoute();
await navigateTo({ path: `/${route.params.educationLevel}`, query: { ...route.query, section: 'adt', preview: undefined } }, { replace: true });
</script>

<template><div /></template>
