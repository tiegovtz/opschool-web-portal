<script setup>
import  ProfileCard  from "@/components/profile/profileCard.vue";


definePageMeta({
  middleware: "auth",
});

</script>

<template>
    <NuxtLayout name="home-layout">
        <section class="flex items-center justify-center py-6">
            <ProfileCard />
        </section>
    </NuxtLayout>
</template>