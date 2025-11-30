<script setup>
import axios from "axios";
import TopicCard from "./TopicCard.vue";
import apiDocs from "~/utilities/api-docs";
import SearchResults from "./SearchResults.vue";

const userToken = useCookie("signInUserToken");

const searchReactive = reactive({
  search: null,
  searchResult: null,
});

const search = async () => {
  const url = userToken.value
    ? `${apiDocs.search.getSearch}?query=${searchReactive.search.trim()}`
    : `${apiDocs.topics.filterTopics}?name=${searchReactive.search.trim()}`;

  await axios
    .get(url,
      {
        headers: {
          Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
        }
      }
    )
    .then((response) => {
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        searchReactive.searchResult = data;
      } else {
        searchReactive.searchResult = null;
      }
    })
    .catch((error) => {
      searchReactive.searchResult = null;
    });
};

defineProps({
  appearance: {
    type: String,
    default: "normal",
  }
});

// watch search
const inputSearch = (event) => {
  const newVal = event.target.value;

  if (newVal && newVal.trim() !== "") {
    // search();
  } else {
    searchReactive.searchResult = null;
  }
};

const mouseOut = () => {
  searchReactive.searchResult = null;
}
</script>

<template>
  <div :class="[
    ' flex items-center justify-center w-full',
    appearance === 'normal'
      ? 'max-w-md'
      : `md:h-72 h-32 bg-background3 bg-cover bg-center bg-no-repeat rounded-md`,]" tabindex="0"
    aria-label="Taasisi ya Elimu Tanzania main building with trees in front" role="region">
    <div :class="[
      ' relative flex items-center justify-center w-full h-full rounded-md',
      appearance === 'normal'
        ? 'md:px-0 lg:px-0'
        : 'bg-textGray bg-opacity-40 md:px-10 lg:px-[100px] p-1',]">

      <!-- Apperance Normal -->
      <form v-if="appearance === 'normal'" action="" @submit.prevent="search"
        class="flex w-full h-10 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue"
        role="search" aria-label="Search for topics">

        <div class="flex items-center w-full">
          <!-- Search Icon -->
          <Icon name="mdi:magnify" aria-label="search icon" class="text-gray-400" size="1.5rem" aria-hidden="true" />

          <!-- Search Input -->
          <label for="search-normal" class="sr-only">Search for topics</label>
          <input type="text" id="search-normal" @input="inputSearch" v-model="searchReactive.search"
            placeholder="What do you want to learn?"
            class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
            :aria-expanded="searchReactive.searchResult ? 'true' : 'false'" />
        </div>

        <!-- Search Button -->
        <button type="submit"
          class="items-center justify-center hidden px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-t-md bg-oceanBlue hover:bg-deepBlue"
          @click="search">
          Search
        </button>
      </form>

      <!-- Apperance Not Normal -->
      <form v-else-if="appearance !== 'normal'" action=""
        class="flex items-center w-full max-w-3xl p-2 bg-white rounded-md h-15" @submit.prevent="search" role="search"
        aria-label="Search for topics">

        <div class="flex items-center w-full pl-4">
          <!-- Search Icon -->
          <Icon name="mdi:magnify" class="text-gray-400" size="1.5rem" aria-hidden="true" />

          <!-- Search Input -->
          <label for="search-large" class="sr-only">Search for topics</label>
          <input type="text" id="search-large" @input="inputSearch" v-model="searchReactive.search"
            class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
            placeholder="What do you want to learn?" :aria-expanded="searchReactive.searchResult ? 'true' : 'false'" />
        </div>

        <!-- Search Button -->
        <button type="submit" role="button" aria-describedby="search-data"
          class="items-center justify-center hidden h-full px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-r-md bg-oceanBlue hover:bg-deepBlue"
          @click="search">
          Search
        </button>
      </form>

      <!-- Result Search with NO userToken -->
      <div v-if="searchReactive.searchResult && searchReactive.search && !userToken" :class="[
        'absolute z-50  w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-scroll',
        appearance === 'normal'
          ? 'top-10 left-0 max-w-md'
          : 'top-[96px] max-w-3xl px-1',]" role="list" aria-label="Search results" aria-live="polite">

        <TopicCard v-for="result in searchReactive.searchResult" model-type="search" :key="result._id"
          :topic-id="result._id" :topic-title="result.name" :topic-image="result.thumbnail"
          :topic-standard="result.standard" :topic-subject="result.subject.name"
          :topic-description="result.descriptions" :topic-level="result.level?.name ?? 'Form 1'" :topic-likes="0"
          :topic-views="topic?.viewedBy?.length ? topic?.viewedBy?.length : 0" topic-duration="0" />
      </div>

      <!-- Result Search with userToken -->
      <div v-else-if="searchReactive.searchResult && searchReactive.search && userToken" :class="[
        'absolute z-50  w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-scroll',
        appearance === 'normal'
          ? 'top-10 left-0 max-w-md'
          : 'top-[180px] max-w-3xl px-1',]" role="list" aria-label="Search results">

        <SearchResults role="option" v-for="result in searchReactive.searchResult" :key="result._id" :id="result._id"
          :title="result.name" :thumbnail="result.thumbnail" :level="result?.level ?? 'Form 1'"
          :subject="result?.subject ?? 'N/A'" :type="result?.type ?? 'topic'" />

      </div>

    </div>
  </div>
</template>
