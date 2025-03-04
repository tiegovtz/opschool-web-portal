<template>
    <NuxtLink :to="`/interactive/${topicId}`" class="overflow-hidden rounded-lg flex flex-col shadow-xs">
        <div class="relative h-56">
          <NuxtImg
            :src="topicImage"
            loading="lazy"
            alt="book1"
            class="w-full h-full object-cover"
          />
          <div class="absolute -bottom-4 right-2">
            <div
              class="bg-darkBlue rounded-full h-8 w-20 flex items-center justify-center gap-2"
            >
              <Icon
                name="solar:star-bold"
                class="text-normalYellow text-medium"
              />
              <p class="text-white text-medium">4.5</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col my-auto mt-5">
          <p class="text-small font-medium text-gray-800">
            {{ topicTitle }}
          </p>
          <p class="text-extraSmall text-gray-500 line-clamp-3">
            {{ topicDescription }}
          </p>
        </div>
        <div class="flex items-center justify-between px-1 pb-2 whitespace-nowrap xl:text-small md:text-extraSmall text-gray-400">
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
        </div>
      </NuxtLink>
</template>


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
})


</script>