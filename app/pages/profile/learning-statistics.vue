<script setup>
import LearningStatisticsCard from "@/components/profile/learningStatisticsCard.vue";

definePageMeta({
  middleware: "auth",
});

const hubHeaderLang = useHubHeaderLanguage();
</script>

<template>
  <NuxtLayout name="home-layout" :language="hubHeaderLang">
    <section
      id="main-container"
      tabindex="-1"
      class="flex justify-center px-3 py-4 sm:px-4 sm:py-6 lg:px-6"
    >
      <div class="w-full max-w-7xl">
        <LearningStatisticsCard />
      </div>
    </section>
  </NuxtLayout>
</template>
