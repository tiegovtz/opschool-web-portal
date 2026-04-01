<script setup>
import ProfileCard from "@/components/profile/profileCard.vue";

definePageMeta({
  middleware: "auth",
});

const pageLanguage = useHubPageLanguage();
</script>

<template>
  <NuxtLayout name="home-layout" :language="pageLanguage">
    <section
      id="main-container"
      tabindex="-1"
      class="flex justify-center px-4 py-6"
    >
      <div class="flex flex-col w-full max-w-7xl gap-4">
        <ProfileCard />
      </div>
    </section>
  </NuxtLayout>
</template>
