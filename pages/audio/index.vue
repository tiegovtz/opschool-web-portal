<template>
  <NuxtLayout name="home-layout">
    <div class="container">
      <HeroSection />
      <TabBar />
      <div class="loading flex justify-center" >
      <LoadingIndicator :is-loading="true" />
    </div>
    <!-- render books -->
    </div>
  </NuxtLayout>
</template>

<script setup>
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'

</script>
