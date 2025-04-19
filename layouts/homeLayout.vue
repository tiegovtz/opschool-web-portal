<template>
  <div class="bg-white">
    <!-- Header -->
    <HeaderView />

    <!-- Main content -->
    <main class="wrapper-container">
     <div class="md:shadow-2xl md:p-4 p-2 bg-white !center-height">
      <slot />
     </div>
    </main>

    <!-- Footer -->
    <FooterView />
  </div>
</template>

<script setup>
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '~/components/included/HeaderView.vue'

</script>
