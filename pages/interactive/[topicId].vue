<template>
  <NuxtLayout name="home-layout">
    <section class="relative w-full h-full inline-flex center-height">
      <!-- loading indicator -->
      <div class="loading content-height flex items-center justify-center w-full" v-if="status=='pending'">
      <LoadingIndicator :is-loading="true" />
   </div>
   <div class="error" v-else-if="status=='error'">
      {{ error.message }}
   </div>
   <div class="sucess" v-if="status=='success'">
    <div class="lg:w-3/4 w-full center-height p-5">
      <!-- Header Description -->
      <div class="flex items-center justify-between">
        <h1 class="text-large font-medium">{{ data.descriptions }}</h1>
        <Icon name="basil:menu-outline" class="cursor-pointer" size="2rem" />
      </div>
      <div class="content" >
        <div class="" v-for="chapter in data.chapters" :key="chapter._id">
          <NuxtImg :src="baseUrl + chapter.thumbnail" class="w-full h-56 object-cover" alt=""/>
          <!-- Chapter Name and Description -->
          <div class="flex items-center justify-between">
            <h1 class="text-large my-4">{{ chapter.name }}</h1>
          </div>
          <!-- Chapter Content -->
          <div class="text-extraSmall text-textGray" v-html="chapter.content">

          </div>
        </div>
      </div>
    </div>
    <div class="absolute right-0 top-0 w-1/4 h-full p-5 bg-oceanBlue ">
      <h1 class="text-lg font-medium mb-4">{{ data.descriptions }}</h1>
      <!-- UL list of chapters -->
      <ul class="flex flex-col gap-3">
        <li class="p-2 bg-gray-100 rounded-md">Chapter 1: Basics</li>
        <li class="p-2 bg-gray-100 rounded-md">Chapter 2: Motion</li>
        <li class="p-2 bg-gray-100 rounded-md">Chapter 3: Forces</li>
        <li class="p-2 bg-gray-100 rounded-md">Chapter 4: Energy</li>
      </ul>
    </div>
   </div>
   <div class="idle" v-else-if="status == 'idle'">
      <p> Try to reload the page ,Something went wrong</p>
   </div>
  </section>
  </NuxtLayout>
</template>

<script setup>
import { baseUrl } from '@/utilities/controlls';
import LoadingIndicator from '@/components/loading/loadingIndicator.vue';

const route = useRoute()
const topicId = route.fullPath.split('/').pop()

// const toggleSidebar = () => {
//   const sidebar = document.querySelector('.sidebar')
//   sidebar.classList.toggle('hidden')
// }

const { data, status, error } = useFetch("/api/get-demo-topics", {
  query: { topicId: topicId },
});
</script>
