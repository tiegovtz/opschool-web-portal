<template>
  <NuxtLayout name="home-layout">
    <div class="container">
      <HeroSection />
      <HomeInputsSelection />
      <TabBar />
      <div v-if="client.includes('http://41.59.102.150:3000/')" class="loading flex flex-col items-center">
        <div>
          <MessageTopicNotFound message="This page will be updated soon" />
          <a href="https://ol.tie.go.tz/index.php" target="_blank" class="flex items-center px-3 py-2 mt-4 capitalize">
            <p class="capitalize">please visit
              <span
                class="text-oceanBlue hover:text-deepBlue transition-colors duration-500 ease-in-out font-medium uppercase">TIE
                library</span>
            </p>
          </a>
        </div>

      </div>
      <div v-else-if="client.includes('http://localhost:3000/ebooks') || client.includes('http://tie.ekima.africa/')"
        class="flex w-full h-full">
        <NuxtLink to="/ebooks/read">
          <div class="flex flex-col gap-4 w-80 h-80 rounded-md shadow-md overflow-hidden">
            <!-- Display Image -->
            <div class="h-50 w-full">
              <NuxtImg src="https://i.pinimg.com/1200x/2c/2f/0b/2c2f0b549007c3addf71905265112680.jpg" alt="User Profile"
                class="w-full h-full object-cover" />
            </div>
            <!-- Diplay the content Author -->
            <div class="flex flex-col px-2 w-full h-full gap-2">
              <h2 class="text-medium font-bold">Science For Kids and Learning</h2>
              <p></p>
            </div>
          </div>
        </NuxtLink>
      </div>
      <div v-else class="loading flex flex-col items-center">
        <MessageTopicNotFound message="This page will be updated soon" />
        <a href="https://ol.tie.go.tz/index.php" target="_blank" class=" px-3 py-2 mt-4">
          <p class="capitalize">please visit
            <span
              class="text-oceanBlue hover:text-deepBlue transition-colors duration-500 ease-in-out font-medium uppercase">TIE
              library</span>
          </p>
        </a>
      </div>

    </div>
  </NuxtLayout>
</template>

<script setup>
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'

const client = ref('')
// Define meta info about page
useHead({
  title: "TIE - Printed books",
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

onMounted(()=>{
  client.value = window.location.href
})
</script>
