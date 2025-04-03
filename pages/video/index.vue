<script setup>
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'
import apiDocs from "~/utilities/api-docs";

useHead({
  title: "TIE - Video Resource",
  meta: [
    {
      name: 'description',
      content: 'TIE is a digital learning platform providing quality educational resources for students and teachers in Tanzania.'
    },
    { name: 'keywords', content: 'Tanzania, education, interactive learning, e-learning, students, teachers' },
    { name: 'author', content: 'Tanzania Institute of Education' },

    // Open Graph (OG) meta tags for social sharing
    { property: 'og:title', content: 'TIE - Tanzania Interactive Learning Platform' },
    { property: 'og:description', content: 'Explore interactive educational resources for students and teachers in Tanzania.' },
    { property: 'og:image', content: 'https://example.com/preview-image.jpg' }, // Replace with actual image URL
    { property: 'og:url', content: 'https://tie.tz' },
    { property: 'og:type', content: 'website' },

    // Twitter Card meta tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'TIE - Tanzania Interactive Learning Platform' },
    { name: 'twitter:description', content: 'Access quality educational content for students and teachers in Tanzania.' },
    { name: 'twitter:image', content: 'https://example.com/preview-image.jpg' } // Replace with actual image URL
  ]
})

// Define state variables
const error = ref(null);
const status = ref('pending');
const videos = ref();

// Define Cookie
const auth_token = useCookie('signInAccessToken').value;

// Fetch Videos From Server
const fetchVideos = async () => {
  try {
    status.value = 'pending';
    const response = await $fetch(apiDocs.videos.getVideos, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`,
        'Content-Type': 'application/json'
      }
    });

    videos.value = response;
    status.value = 'success';

  } catch (error) {
    status.value = 'error';
    error.value = error;
    console.log(error);
  }
}

// Call FetchVideos Function
fetchVideos();

// Define Meta Data
definePageMeta({
  middleware: 'auth',
})

</script>

<template>
  <NuxtLayout name="home-layout">
    <section class="wrapper-container">
      <HeroSection />
      <HomeInputsSelection />
      <TabBar />
      <div v-if="status === 'success'"
        class="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-2 xl:gap-4">
        <VideoCard v-for="video in videos" :key="video._id" :video-id="video._id" :video-name="video.name"
          :video-thumbnail="video.thumbnail" :video-file-url="video.videoFileUrl" :video-description="video.description"
          :video-subject="video.subject.name" :video-type="video.videoType" />
      </div>
      <!-- pending -->
      <div v-else-if="status === 'pending'" class="flex flex-col justify-center items-center">
        <LoadingIndicator :is-loading="true" />
      </div>
      <!-- error -->
      <div v-else>
        Error: {{ error?.message }}
      </div>
    </section>
  </NuxtLayout>
</template>

<template>
  <NuxtLayout name="home-layout">
    <section class="wrapper-container">
      <HeroSection />
      <HomeInputsSelection />
      <TabBar />
      <div v-if="status === 'success'"
        class="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-2 xl:gap-4">
        <VideoCard v-for="video in videos" :key="video._id" :video-id="video._id" :video-name="video.name"
          :video-thumbnail="video.thumbnail" :video-file-url="video.videoFileUrl" :video-description="video.description"
          :video-subject="video.subject.name" :video-type="video.videoType" />
      </div>
      <!-- pending -->
      <div v-else-if="status === 'pending'" class="flex flex-col justify-center items-center">
        <LoadingIndicator :is-loading="true" />
      </div>
      <!-- error -->
      <div v-else>
        Error: {{ error?.message }}
      </div>
    </section>
  </NuxtLayout>
</template>