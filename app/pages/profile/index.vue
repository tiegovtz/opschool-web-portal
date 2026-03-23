<script setup>
import ProfileCard from "@/components/profile/profileCard.vue";

definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <NuxtLayout name="home-layout">
    <section
      id="main-container"
      tabindex="-1"
      class="flex justify-center px-4 py-6"
    >
      <div class="flex flex-col w-full max-w-7xl gap-4">
        <div
          class="flex flex-col gap-3 p-5 bg-white border shadow-sm rounded-3xl border-slate-200 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p class="text-sm font-medium uppercase tracking-[0.2em] text-oceanBlue">
              Profile
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900">
              Personal Details
            </h1>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Manage your account information here. Learning statistics now has
              its own page.
            </p>
          </div>

          <NuxtLink
            to="/profile/learning-statistics"
            class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue"
          >
            <Icon
              name="heroicons:chart-bar-square-20-solid"
              class="w-5 h-5"
            />
            <span>Open Learning Statistics</span>
          </NuxtLink>
        </div>

        <ProfileCard />
      </div>
    </section>
  </NuxtLayout>
</template>
