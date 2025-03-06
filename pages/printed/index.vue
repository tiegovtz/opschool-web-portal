<template>
  <div class="container">
    <HeroSection />
    <TabBar />
    <div class="loading flex justify-center" >
      <LoadingIndicator :is-loading="true" />
    </div>
    <!-- render books -->
  </div>
</template>

<script setup>
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'

</script>
