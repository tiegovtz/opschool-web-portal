<script setup>
import axios from 'axios';
import apiDocs from '@/utilities/api-docs';
import TopicCard from './TopicCard.vue';

const searchReactive = reactive({
  search: null,
  searchResult: null
})

const search = async () => {
  await axios.get(`${apiDocs.topics.filterTopics}?name=${searchReactive.search}`)
    .then((response) => {
      searchReactive.searchResult = response.data;
    })
    .catch((error) => {
      searchReactive.searchResult = null;
    })
}

// watch search
watch(() => searchReactive.search, (newVal) => {
  if (newVal) {
    search();
  }
})
</script>

<template>
  <div class="relative flex items-center justify-center w-full max-w-md">
    <!-- Search Form -->
    <form action="" @submit.prevent="search" @focusout="searchReactive.searchResult = null"
      class="flex w-full h-10 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <div class="flex items-center w-full">
        <!-- Search Icon -->
        <Icon name="mdi:magnify" class="text-gray-400" size="1.5rem" />

        <!-- Search Input -->
        <input type="text" v-model="searchReactive.search" placeholder="What do you want to learn?"
          class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue" />
      </div>

      <!-- Search Button -->
      <button type="submit" @click="search"
        class="text-white p-2 rounded-t-md rounded-b-none  bg-oceanBlue hover:bg-oceanBlue/80 transition duration-500 cursor-pointer">
        Search
      </button>
    </form>
    <!-- Result Search -->
    <div class="absolute z-50 top-10 left-0 w-full max-w-md bg-white shadow-md rounded-md">
      <TopicCard v-for="result in searchReactive.searchResult" :key="result._id" model-type="search"
        :topic-id="result._id" :topic-title="result.name" :topic-image="result.thumbnail"
        :topic-standard="result.standard" :topic-subject="result.subject.name" :topic-description="result.descriptions"
        :topic-level="result.level.name" :topic-likes="0" :topic-views="0" topic-duration="0" />
    </div>
  </div>
</template>