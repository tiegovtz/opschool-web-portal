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
  }
})

const setTopicToView = () => {
  useState('topicToView', () => `/interactive/${props.topicStandard.toLowerCase()}/${props.subjectName.toLowerCase()}/${props.topicTitle.toLowerCase()}/${props.topicId.toLowerCase()}`);
  useState('topicLevel', () => `${props.topicLevel}`);
  useState('topicTitle', () => `${props.topicTitle}`);
  useState('topicStandard', () => `${props.topicStandard}`);
  useState('topicId', () => `${props.topicId}`)
}

</script>

<template>
  <NuxtLink
    :to="`/interactive/${topicStandard.toLowerCase()}/${subjectName.toLowerCase()}/${topicTitle.toLowerCase()}/${topicId.toLowerCase()}`"
    class="overflow-hidden rounded-lg flex flex-col shadow-md px-2 pb-4" @click="setTopicToView">
    <!-- topic image -->
    <div class="relative h-56">
      <NuxtImg :src="topicImage" loading="lazy" alt="book1" class="w-full h-full object-cover rounded-t-md" />
      <!-- topic standard -->
      <div class="absolute -bottom-0 right-0">
        <div class="bg-oceanBlue  rounded-tl-md  h-8 w-20 flex items-center justify-center">
         <p class="text-extraSmall font-medium text-white">{{ topicStandard }}</p>
        </div>
      </div>
    </div>
    <!-- topic progress bar -->
    <div class="flex items-center gap-2 w-full mt-2 max-w-full">
      <progress :value="45" max="100" class="w-full h-2 rounded-full bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200 
           [&::-webkit-progress-value]:bg-oceanBlue [&::-webkit-progress-value]:rounded-full 
           [&::-moz-progress-bar]:bg-oceanBlue [&::-moz-progress-bar]:rounded-full 
           transition-all duration-500">
      </progress>
      <span class="text-xs sm:text-sm font-medium text-oceanBlue whitespace-nowrap">
        {{ 45 }}%
      </span>
    </div>
    <!-- topic title and description -->
    <div class="flex flex-col my-auto px-1">
      <p class="text-small font-medium text-gray-800">
        {{ topicTitle }}
      </p>
      <p class="text-extraSmall text-black/80 line-clamp-2">
        {{ topicDescription }}
      </p>
    </div>
    <!-- topic subject name and metrics -->
    <div class="flex items-center justify-between px-1 pt-2 whitespace-nowrap text-extraSmall text-oceanBlue">
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
  </NuxtLink>
</template>
