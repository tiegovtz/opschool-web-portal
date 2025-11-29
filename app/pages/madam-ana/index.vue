<script setup>
import ChatKitPanel from "~/components/chatkit/ChatKitPanel.vue";
</script>

<template>
  <NuxtLayout name="home-layout">
    <div class="wrapper-container py-8">
      <h1 class="text-3xl font-bold text-deepBlue mb-4">Madam Ana</h1>
      <div class="prose max-w-none mb-6">
        <p class="text-medium text-gray-700">
          Welcome to Madam Ana's page. Chat with our AI assistant below.
        </p>
      </div>
      <ClientOnly>
        <div class="mx-auto w-full max-w-5xl">
          <ChatKitPanel />
        </div>
        <template #fallback>
          <div class="flex items-center justify-center h-[90vh]">
            <p class="text-gray-600">Loading ChatKit...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>

