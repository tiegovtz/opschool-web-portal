<script setup>
import { calculateTopicMetrics } from '@/utilities/topicMetrics'


const props = defineProps({
  topicId: {
    type: String,
    required: true,
  },
  topicImage: {
    type: String,
    required: true,
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
  topicTitle: {
    type: String,
    default: 'Introduction to Physics',
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

})

const setTopicToView = () => {
  useState('topicToView', () => `/interactive/${props.topicStandard.toLowerCase()}/${props.subjectName.toLowerCase()}/${props.topicTitle.toLowerCase()}/${props.topicId.toLowerCase()}`);
  useState('topicLevel', () => `${props.topicLevel}`);
  useState('topicTitle', () => `${props.topicTitle}`);
  useState('topicStandard', () => `${props.topicStandard}`);
  useState('topicId', () => `${props.topicId}`)
}

const userToken = useCookie('signInUserToken')
</script>


<template>

  <NuxtLink
    :to="`/interactive/${topicStandard.toLowerCase()}/${subjectName.toLowerCase()}/${topicTitle.toLowerCase()}/${topicId.toLowerCase()}`"
    class="relative overflow-hidden rounded-lg flex flex-col shadow-md pb-4 group" @click="setTopicToView"
    :class="{ 'cursor-pointer flex-row my-2 pb-0': modelType === 'search' }">
    <!-- topic image -->
    <div class="overflow-hidden" :class="{ 'relative h-56': modelType === 'card', 'md:h-20 h-10': modelType === 'search' }">
      <NuxtImg :src="topicImage" loading="lazy" alt="book1" class="w-full h-full object-cover transform group-hover:scale-110 duration-1000 ease-in-out"
        :class="{ 'rounded-t-md': modelType === 'card', 'rounded-md': modelType === 'search' }" />
      <!-- topic standard -->
      <div v-if="modelType === 'card'" class="absolute -bottom-0 right-0">
        <div
          class="bg-oceanBlue group-hover:bg-deepBlue rounded-tl-md  h-8 w-20 flex items-center justify-center transition-color duration-500 ease-in-out">
          <p class="text-extraSmall font-medium text-white">{{ topicStandard }}</p>
        </div>
      </div>
    </div>
    <!-- topic information -->
    <div
      class="bg-white flex-1 group-hover:bg-deepBlue px-4 group-hover:text-white transition-all duration-500 ease-in-out">
      <!-- topic progress bar -->
      <div v-if="userToken && modelType === 'card'" class="flex items-center gap-2 w-full mt-2 max-w-full">
        <progress :value="45" max="100" class="topic-card__progress-bar">
        </progress>
        <span class="text-xs sm:text-sm font-medium text-oceanBlue whitespace-nowrap group-hover:text-white">
          {{ 45 }}%
        </span>
      </div>
      <!-- topic title and description -->
      <div class="flex flex-col my-auto    transition-all duration-500 ease-in-out">
        <p class="text-[1.2rem] font-bold text-gray-800 group-hover:text-white "
          :class="{ 'mt-2': !userToken, 'md:text-[1.2rem] text-[1rem] font-medium': modelType === 'search' }">
          {{ topicTitle }}
        </p>
        <p v-if="modelType === 'card'" class="text-small text-black/80 group-hover:text-white  line-clamp-2">
          {{ topicDescription }}
        </p>
      </div>
      <!-- topic subject name and metrics -->
      <div v-if="modelType === 'card'"
        class="flex items-center justify-between pt-2 lg:pb-0 pb-2 whitespace-nowrap text-extraSmall text-oceanBlue">
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
      <div v-if="modelType == 'card'"
        class="absolute z-10 bottom-0 opacity-0 lg:flex hidden items-center justify-between px-4 w-full h-10 bg-gradient-to-b from-deepBlue to-gray-800 text-white group-hover:opacity-100 transition-all duration-500 ease-in-out">
        <p class="text-small capitalize">Start learning</p>
        <div class="flex items-center justify-center h-6 w-6 rounded-full bg-white animate-bounce-horizontal">
          <Icon name="weui:arrow-filled" size="20" class="text-deepBlue" />
        </div>
      </div>
    </div>
    <!-- learn more -->
    <div v-if="modelType == 'card'"
      class="flex lg:hidden items-center justify-between px-4 w-full h-8 bg-gradient-to-b from-deepBlue to-gray-800 text-white ">
      <p class="text-small capitalize">Start learning</p>
      <div class="flex items-center justify-center h-6 w-6 rounded-full bg-white animate-bounce-horizontal">
        <Icon name="weui:arrow-filled" size="20" class="text-deepBlue" />
      </div>
    </div>
  </NuxtLink>

</template>