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
  useState('topicId', () => `${props.topicId}` )
}

</script>

<template>
  <NuxtLink
    :to="`/interactive/${topicStandard.toLowerCase()}/${subjectName.toLowerCase()}/${topicTitle.toLowerCase()}/${topicId.toLowerCase()}`"
    class="overflow-hidden rounded-lg flex flex-col shadow-md px-2 pb-4" @click="setTopicToView">
    <div class="relative h-56">
      <NuxtImg :src="topicImage" loading="lazy" alt="book1" class="w-full h-full object-cover rounded-t-md" />
      <div class="absolute -bottom-4 right-2">
        <div class="bg-oceanBlue  rounded-full h-8 w-20 flex items-center justify-center">
          <p class="text-white text-small">45</p>
          <Icon name="ic:round-percent" class="text-white text-medium" />
        </div>
      </div>
    </div>
    <div class="flex flex-col my-auto mt-5 px-1">
      <p class="text-small font-medium text-gray-800">
        {{ topicTitle }}
      </p>
      <p class="text-extraSmall text-gray-500 line-clamp-2">
        {{ topicDescription }}
      </p>
    </div>
    <!-- <div class="flex items-center justify-between px-1 pb-2 whitespace-nowrap text-extraSmall text-gray-400">
      <div class="flex items-center gap-2">
        <Icon name="proicons:clock" class="text-medium" />
        <p class="capitalize">{{ topicDuration }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Icon name="mdi-light:heart" class="text-medium" />
        <p class="">{{ calculateTopicMetrics(topicLikes) + " Likes" }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Icon name="flowbite:users-outline" class="text-medium" />
        <p class="">{{ calculateTopicMetrics(topicViews) + " Views" }}</p>
      </div>
    </div> -->
  </NuxtLink>
</template>

