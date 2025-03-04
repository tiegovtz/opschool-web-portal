<template>
  <div class="container">
    <HeroSection />
    <TabBar />

    <div v-if="status === 'pending'">Loading...</div>
    <div v-else-if="status === 'error'">Error: {{ error.message }}</div>
    <div v-else-if="status === 'success'">
      <div class=" grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-6 mb-10">
        <TopicCard v-for="topic in slicedData" :key="topic.topic_id" :topic-id="topic.topic_id"
          :topic-image="'https://kisomo.co.tz/kisomo app/' + topic.img_path" :topic-title="topic.topic_title"
          :topic-description="topic.topic_description"
          :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'"
          :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-views="topic.views ? topic.views : 100" />

      </div>

      <!-- pagination numbers based on data length greater to 9 -->
      <div class="flex justify-center mb-10">
        <div v-if="totalPages <= 5" class="flex justify-center gap-2">
          <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page" :is-active="page === currentPage"
            :disabled="page === currentPage" @click="sliceData((page - 1) * pageSize, page * pageSize)"
            @send-page-number="currentPage = $event" />
        </div>
        <div v-else class="flex justify-center gap-2">
          <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page" :is-active="page === currentPage"
            :disabled="page === currentPage" @click="sliceData((page - 1) * pageSize, page * pageSize)"
            @send-page-number="currentPage = $event" />
        </div>
      </div>
    </div>
    <div v-else>
      <p>Try to refresh the page</p>
    </div>
  </div>
</template>

<script setup>
import TopicCard from "@/components/home/TopicCard.vue";
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'
import { ref, computed, onMounted } from 'vue';


const { data, status, error } = useFetch("/api/get-topic", {
  query: { streamId: 1, subjectId: 3 },
});

// current page data
const currentPage = ref(1);
const pageSize = 9;
// total pages data
const totalPages = computed(() => {
  return Math.ceil(data.value.data.length / pageSize);
});

// slice data to 9
const slicedData = ref();
const sliceData = (start, end) => {
  slicedData.value = data.value.data.slice(start, end);
};

// slice data on mount
onMounted(() => {
  sliceData((currentPage.value - 1) * pageSize, currentPage.value * pageSize);
});

</script>