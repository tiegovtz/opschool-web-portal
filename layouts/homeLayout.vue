<template>
  <div class="bg-white">
    <!-- Header -->
    <HeaderView />


    <!-- Main content -->
    <main class="center-height container">
      <slot />
    </main>

    <!-- Footer -->
    <FooterView />
  </div>
</template>

<script setup>
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '~/components/included/HeaderView.vue'

</script>
