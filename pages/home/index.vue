
<script setup>
import TopicCard from "@/components/home/TopicCard.vue";
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'
import { ref, computed, onMounted } from 'vue';
import { isGreaterToXL, isGreaterToLG, isGreaterToMD, isGreaterToSM, screenWidth } from '@/utilities/controlls';
import InputsSelection from '@/components/home/InputsSelection.vue'

const { data, status, error } = useFetch("/api/get-topic", {
  query: { streamId: 1, subjectId: 3 },
});

  // current page data
  const currentPage = ref(1);
  const pageSize = ref(isGreaterToXL.value ? 12 : isGreaterToLG.value ? 9 : isGreaterToMD.value ? 6 : isGreaterToSM.value ? 4 : 4);


  // total pages data
  const totalPages = computed(() => {
    return Math.ceil(data.value.data.length / pageSize.value);
  });

  // extact total pages in groups of 5


  // slice data to 9
  const slicedData = ref();
  const sliceData = (start, end) => {
    slicedData.value = data.value.data.slice(start, end);
  };

// On mount, always slice with initial 12 items
onMounted(() => {
  sliceData(
    (currentPage.value - 1) * pageSize.value, 
    currentPage.value * pageSize.value
  )
})

// Watch screen width and update page size accordingly
watch(() => screenWidth.value, () => {
  if (screenWidth.value >= 1280) {
    pageSize.value = 12
  } else if (screenWidth.value >= 1024 && screenWidth.value < 1280) {
    pageSize.value = 9
  } else if (screenWidth.value >= 768 && screenWidth.value < 1024) {
    pageSize.value = 6
  } else if (screenWidth.value >= 640 && screenWidth.value < 768) {
    pageSize.value = 4
  } else {
    pageSize.value = 4
  }
}, { immediate: true });

// once pages are more than 5, handle pagination
const nextPage = () => {
  currentPage.value++;
  currentPage.value = currentPage.value > totalPages.value ? totalPages.value : currentPage.value;
  sliceData((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
}

const prevPage = () => {
  currentPage.value--;
  currentPage.value = currentPage.value < 1 ? 1 : currentPage.value;
  sliceData((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
}
</script>

<template>
  <div class="container">
    <HeroSection />
    <TabBar />
    <InputsSelection />

    <div v-if="status === 'pending'" class="flex justify-center items-center">Loading...</div>
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
          <!-- previous -->
          <div class="flex justify-center items-center" v-if="currentPage > 5">
              <Icon name="iconamoon:arrow-left-2-fill"  size="2rem" @click="prevPage"/>
             </div>
          <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page" :is-active="page === currentPage"
            :disabled="page === currentPage" @click="sliceData((page - 1) * pageSize, page * pageSize)"
            @send-page-number="currentPage = $event" />

            <!-- next button -->
             <div class="flex justify-center items-center" v-if="currentPage >4">
              <Icon name="iconamoon:arrow-right-2-fill"  size="2rem" @click="nextPage"/>
             </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p>Try to refresh the page</p>
    </div>
  </div>
</template>
