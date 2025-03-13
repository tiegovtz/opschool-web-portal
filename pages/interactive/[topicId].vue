<script setup>
import { baseUrl } from '@/utilities/controlls';
import LoadingIndicator from '@/components/loading/loadingIndicator.vue';

// Define meta info about page
useHead({
  title: "TIE - Tanzania/volumetric analysis",
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


// const topicToView = useState('topicToView');
const topicLevel = useState('topicLevel');
const topicTitle = useState('topicTitle');
const topicStandard = useState('topicStandard');

const userToken = useCookie('signInUserToken')


// const toggleSidebar = () => {
  //   const sidebar = document.querySelector('.sidebar')
  //   sidebar.classList.toggle('hidden')
  // }

  const route = useRoute()
  const topicId = route.fullPath.split('/').pop()

const { data, status, error } = useFetch(`/api/topics/${topicId}`);

definePageMeta({
  middleware:'auth'
})

watch(userToken,(token) => {

  // Get the router instance
  const router = useRouter()

  if (!token) {
    router.replace('/')
  }
})

</script>

<template>
  <NuxtLayout name="home-layout">
    <section class="relative w-full h-full inline-flex center-height overflow-hidden">
      <!-- loading indicator -->
      <div class="loading content-height flex items-center justify-center w-full" v-if="status == 'pending'">
        <LoadingIndicator :is-loading="true" />
      </div>
      <div class="error" v-else-if="status == 'error'">
        {{ error.message }}
      </div>
      <div class="sucess w-full" v-if="status == 'success'">
        <div
          class="lg:w-3/4 w-full scroll-height overflow-y-scroll p-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">

          <!-- Topic Level Standard and Subject Indicator -->
          <div class="flex items-center gap-2">
            <p class="capitalize text-oceanBlue text-small">{{ topicLevel != null && topicLevel != undefined &&
              topicLevel != 'null' ? topicLevel : `Secondary` }}</p>
            <Icon name="weui:arrow-outlined" size="16" class="text-oceanBlue" />

            <p class="capitalize text-oceanBlue text-small">
              {{ topicStandard != null && topicStandard != undefined && topicStandard != 'null' ? topicStandard : `Form
              One` }}
            </p>
            <Icon name="weui:arrow-outlined" size="16" class="text-oceanBlue" />

            <p class="capitalize text-small">{{ topicTitle != null && topicTitle != undefined && topicTitle != 'null' ? topicTitle
              : `Introduction to Physics` }}</p>
          </div>

          <!-- Header Description -->
          <div class="flex items-center justify-end">
            <div class="flex lg:hidden">
              <Icon name="basil:menu-outline" class="cursor-pointer " size="2rem" />
            </div>
          </div>
          <div class="content-view">
            <div class="" v-for="chapter in data.chapters" :key="chapter._id">
              <div class="max-h-[800px] h-auto overflow-hidden mb-10 xl:p-6">
                <video data-v-fa195f18="" class="rounded-md" controls id="video" nodownload="true" preload="auto"
                  src="https://kisomo.co.tz/kisomo%20app/kisomo_schools/backend/contents/videos/How To Do Titration Calculations -edited.mp4"
                  type="video/mp4"> Your browser does not support the track element. </video>
              </div>
              <NuxtImg :src="baseUrl + chapter.thumbnail" class="w-full h-56 object-cover" alt="" />
              <!-- Chapter Name and Description -->
              <div class="flex items-center justify-between">
                <h1 class="text-large my-4">{{ chapter.name }}</h1>
              </div>
              <!-- Chapter Content -->
              <div class="!text-extraSmall text-textGray" v-html="chapter.content">

              </div>
            </div>
          </div>
        </div>
        <div class="absolute -right-full lg:right-0 top-0 w-1/4 h-full p-5 shadow-md">
          <h1 class="text-lg font-medium mb-4">{{ data.name }}</h1>
          <!-- UL list of chapters -->
          <ul class="flex flex-col gap-3 pl-4">
            <li class="flex items-center gap-2 cursor-pointer p-3 rounded-md bg-containerGray">
              <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
              Chapter 1: Basics
            </li>
            <li class="flex items-center gap-2 cursor-pointer p-3 rounded-md bg-containerGray">
              <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
              Chapter 2: Motion
            </li>
            <li class="flex items-center gap-2 cursor-pointer p-3 rounded-md bg-containerGray">
              <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
              Chapter 3: Forces
            </li>
            <li class="flex items-center gap-2 cursor-pointer p-3 rounded-md bg-containerGray">
              <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
              Chapter 4: Energy
            </li>
          </ul>
        </div>
      </div>
      <div class="idle" v-else-if="status == 'idle'">
        <p> Try to reload the page ,Something went wrong</p>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
:deep(.swiper-pagination-bullet) {
  width: 1rem; /* w-4 = 1rem */
  height: 1rem; /* h-4 = 1rem */
  background-color: #6b7280; /* bg-gray-500 */
  opacity: 0.75;
  transition: all;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: #3b82f6; /* bg-blue-500 */
  width: 1.5rem; /* w-6 = 1.5rem */
  height: 1.5rem; /* h-6 = 1.5rem */
  opacity: 1;
}
</style>