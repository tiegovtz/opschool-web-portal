<script setup>
import axios from 'axios';
import TopicCard from './TopicCard.vue';
import apiDocsFile from "~/utilities/api-docs";;
const apiDocs = apiDocsFile.setup()
const searchReactive = reactive({
  search: null,
  searchResult: null
})

const search = async () => {
  await axios.get(`${apiDocs.topics.filterTopics}?name=${searchReactive.search.trim()}`)
    .then((response) => {
      searchReactive.searchResult = response.data;
    })
    .catch((error) => {
      searchReactive.searchResult = null;
    })
}

defineProps({
  appearance: {
    type: String,
    default: 'normal'
  }
})

// watch search
watch(() => searchReactive.search, (newVal) => {
  if (newVal && newVal.trim() !== '') {
    search();
  }else {
    searchReactive.searchResult = null;
  }
})
</script>

<template>
  <div :class="[
    ' flex items-center justify-center w-full',
    appearance === 'normal' ? 'max-w-md':`h-72 bg-[url('/public/images/background3.webp')] bg-cover bg-center bg-no-repeat rounded-md`
  ]"
  >
   <div :class="[
    ' relative flex items-center justify-center w-full h-full rounded-md',
     appearance === 'normal' ? 'md:px-0 lg:px-0': 'bg-textGray bg-opacity-40 md:px-10 lg:px-[100px]'
   ]">
     <!-- Apperance Normal -->
    <form v-if="appearance === 'normal'" action="" @submit.prevent="search"
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
        class="items-center justify-center hidden px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-t-md bg-oceanBlue hover:bg-deepBlue">
        Search
      </button>
    </form>
    
    <!-- Apperance Not Normal -->
     <form v-else action="" class="flex items-center w-full max-w-3xl bg-white rounded-md h-15 "
      @submit.prevent="search">
      <div class="flex items-center w-full pl-4">
        <!-- Search Icon -->
        <Icon name="mdi:magnify" class="text-gray-400" size="1.5rem" />

        <!-- Search Input -->
        <input type="text" v-model="searchReactive.search" placeholder="What do you want to learn?"
          class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue" />
      </div>

      <!-- Search Button -->
      <button type="submit" @click="search"
        class="items-center justify-center hidden h-full px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-r-md bg-oceanBlue hover:bg-deepBlue">
        Search
      </button>
    </form>
    <!-- Result Search -->
    <div :class="[
            'absolute z-50  w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-scroll',
            appearance === 'normal' ? 'top-10 left-0 max-w-md' : 'top-[170px] max-w-3xl px-1'
          ]"
    >
      <TopicCard v-for="result in searchReactive.searchResult" :key="result._id" model-type="search"
        :topic-id="result._id" :topic-title="result.name" :topic-image="result.thumbnail"
        :topic-standard="result.standard" :topic-subject="result.subject.name" :topic-description="result.descriptions"
        :topic-level="result.level.name" :topic-likes="0" :topic-views="topic.viewedBy?.length ? topic.viewedBy?.length : 0" topic-duration="0" />
    </div>
   </div>
  </div>
  
</template>