<script setup>
definePageMeta({
  redirect: {
    path: '/home',
    statusCode: 301,
    replace: true,             
  },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
