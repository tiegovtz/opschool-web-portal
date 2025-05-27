<script setup>
import { calculateTopicMetrics } from '@/utilities/topicMetrics'
import { layoutEffect } from '~/utilities/controlls'

// Define Stores
const navigationStore = useNavigationStore()

// Define Props
const props = defineProps({
  topicId: {
    type: String,
    required: true,
  },
  topicImage: {
    type: String,
    default: '/images/background2.webp',
  },
  topicTitle: {
    type: String,
    required: true,
  },
  topicDescription: {
    type: String,
    required: true,
  },
  topicDuration: {
    type: String,
    required: true,
  },
  topicLikes: {
    types: Number,
    required: true,
  },
  topicViews: {
    type: Number,
    required: true,
  },
  topicLevel: {
    type: String,
    default: 'Secondary',
  },
  topicStandard: {
    type: String,
    default: 'Form One',
  },
  subjectName: {
    type: String,
    default: 'Physics'
  },
  modelType: {
    type: String,
    default: 'card',
  },

  // progress
  topicProgress: {
    type: Number,
    default: 0,
  },
  topicViewed: Boolean

})

const setTopicToView = () => {
  navigationStore.setTopic(`/interactive/${props.topicStandard.toLowerCase()}/${props.subjectName.toLowerCase()}/${props.topicTitle.toLowerCase()}/${props.topicId.toLowerCase()}`)
  useState('topicToView',
    () => (
      {
        route: `/interactive/${props.topicStandard.toLowerCase()}/${props.subjectName.toLowerCase()}/${props.topicTitle.toLowerCase()}/${props.topicId.toLowerCase()}`,
        updatedAt: Date.now()
      })
  );
  useState('userViewedTopic', () => props.topicViewed)
}

const userToken = useCookie('signInUserToken')
</script>


<template>

  <NuxtLink
    :to="`/interactive/${topicStandard.toLowerCase()}/${subjectName.toLowerCase()}/${topicTitle.toLowerCase()}/${topicId.toLowerCase()}`"
    v-trusted
    @click="setTopicToView()"
    
    :class="[
      'relative flex overflow-hidden rounded-lg shadow-md group transition-all duration-500 ease-in-out min-w-[300px]',
      layoutEffect == 'grid' && modelType === 'card' ? 'flex-col lg:pb-4' : 'flex-row h-32',
      { 'cursor-pointer flex-row my-2 pb-0 md:h-20 !max-h-14 ': modelType === 'search' },
    ]">
    <!-- topic image -->
    <div 
    :class="[
      'relative overflow-hidden transition-all duration-500 ease-in-out',
      layoutEffect == 'grid' && modelType === 'card' ? 'h-56' : 'w-full max-w-[200px]',
      { 'md:h-20 !h-full ': modelType === 'search', },
    ]">
      <NuxtImg :src="topicImage" loading="lazy" :alt="'Image of ' + topicTitle"
        :class="[
          'object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110',
          { 'rounded-t-md': modelType === 'card', 'rounded-md': modelType === 'search' },
        ]" />
      <!-- topic standard -->
      <div v-if="modelType === 'card'" class="absolute right-0 -bottom-0">
        <div
          class="flex items-center justify-center w-20 h-8 duration-500 ease-in-out bg-oceanBlue group-hover:bg-deepBlue rounded-tl-md transition-color">
          <p class="font-medium text-white text-extraSmall">{{ topicStandard }}</p>
        </div>
      </div>
    </div>
    
    <!-- topic information -->
    <div
      class="flex-1 px-4 transition-all duration-500 ease-in-out bg-white group-hover:bg-deepBlue group-hover:text-white">
      <!-- topic progress bar -->
      <div v-if="userToken && modelType === 'card' && layoutEffect === 'grid'"
        class="flex items-center w-full max-w-full gap-2 mt-2">
        
        <progress :value="Math.min(topicProgress ?? 0, 100)" max="100"
          class="transition-all duration-500 ease-in-out topic-card__progress-bar">
        </progress>

        <span class="text-xs font-medium sm:text-sm text-oceanBlue whitespace-nowrap group-hover:text-white">
          {{ Math.min(topicProgress ?? 0, 100).toFixed(1)  }}%
        </span>
      </div>
      <!-- topic title and description -->
      <div class="flex flex-col my-auto transition-all duration-500 ease-in-out">
        <p
          :class="[
            'text-[1.2rem] font-bold text-gray-800 group-hover:text-white',
          { 'mt-2': !userToken, 'md:text-[1.2rem] text-[1rem] font-medium': modelType === 'search' }
          ]">
          {{ topicTitle }}
        </p>
        <p v-if="modelType === 'card'" class="text-small text-black/80 group-hover:text-white line-clamp-2">
          {{ topicDescription }}
        </p>
      </div>
      
      <!-- topic subject name and metrics -->
      <div v-if="modelType === 'card'" v-trusted
        class="flex items-center justify-between pt-2 pb-2 lg:pb-0 whitespace-nowrap text-extraSmall text-oceanBlue">
        <div class="flex items-center gap-2">
          <Icon name="material-symbols-light:menu-book-outline-rounded" class="text-medium" />
          <p class="capitalize">{{ subjectName }}</p>
        </div>
        <!-- <div class="flex items-center gap-2">
                <Icon name="mdi-light:heart" class="text-medium" />
                <p class="">{{ calculateTopicMetrics(topicLikes) + " Likes" }}</p>
              </div> -->
        <div class="flex items-center gap-2">
          <Icon name="flowbite:users-outline" class="text-medium" />
          <p class="">{{ calculateTopicMetrics(topicViews) + " Views" }}</p>
        </div>
      </div>
    </div>
    <div>
      
      <!-- learn more -->
      <div v-if="modelType == 'card'" v-trusted
        class="absolute bottom-0 z-10 items-center justify-between hidden w-full h-10 px-4 text-white transition-all duration-500 ease-in-out opacity-0 lg:flex bg-gradient-to-b from-deepBlue to-gray-800 group-hover:opacity-100">
        <p class="capitalize text-small">Start learning</p>
        <div class="flex items-center justify-center w-6 h-6 bg-white rounded-full animate-bounce-horizontal">
          <Icon name="weui:arrow-filled" size="20" class="text-deepBlue" />
        </div>
      </div>
    </div>
    
    <!-- learn more -->
    <div v-if="modelType == 'card'" v-trusted
      class="flex items-center justify-between w-full h-8 px-4 text-white lg:hidden bg-gradient-to-b from-deepBlue to-gray-800 ">
      <p class="capitalize text-small">Start learning</p>
      <div class="flex items-center justify-center w-6 h-6 bg-white rounded-full animate-bounce-horizontal">
        <Icon name="weui:arrow-filled" size="20" class="text-deepBlue" />
      </div>
    </div>
  </NuxtLink>

</template>