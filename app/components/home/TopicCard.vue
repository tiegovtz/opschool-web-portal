<script setup lang="ts">
import { calculateTopicMetrics } from '@/utilities/topicMetrics'
import { layoutEffect } from '~/utilities/controlls'
import { useNavigationStore } from "~/stores/navigationStore";
import {
  getEducationRouteQuery,
  resolveRouteLanguage,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";

// Define Stores
const navigationStore = useNavigationStore()
const route = useRoute();
const primaryContentLanguage = usePrimaryContentLanguage();

// Define Props
const props = withDefaults(defineProps<{
  topicId: string,
  topicImage?: string,
  topicTitle: string,
  topicDescription: string,
  topicDuration?: string,
  topicLikes?: number,
  topicViews: number,
  topicLevel?: string,
  topicStandard?: string,
  subjectName?: string,
  modelType?: string,

  // progress
  topicProgress?: number,
  topicViewed?: boolean,
  altText?:string

}>(), {
  topicImage: '',
  topicLevel: 'Secondary',
  topicStandard: 'Form One',
  subjectName: 'Physics',
  modelType: 'card',
  topicProgress: 0,
  topicViewed: false,
})

const topicTarget = computed(() => ({
  path: `/interactive/${props.topicStandard}/${props.subjectName}/${props.topicTitle}/${props.topicId}`,
  query: getEducationRouteQuery(
    resolveEducationLevelFromRoute(route),
    {},
    resolveRouteLanguage(route, undefined, primaryContentLanguage.value),
  ),
}));

const rememberedTopicRoute = computed(() => {
  const params = new URLSearchParams(
    topicTarget.value.query as Record<string, string>,
  ).toString();

  return `${topicTarget.value.path}${params ? `?${params}` : ""}`;
});

const setTopicToView = () => {
  navigationStore.setTopic(rememberedTopicRoute.value)
  useState('topicToView',
    () => (
      {
        route: rememberedTopicRoute.value,
        updatedAt: Date.now()
      })
  );
  useState('userViewedTopic', () => props.topicViewed)
}

const userToken = useCookie('signInUserToken')
</script>

<template>
  <NuxtLink class="stat-card" v-if="modelType.toLowerCase() === 'profile'" @click="setTopicToView()"
    :to="topicTarget">
    <!-- profile view -->
    <div class="relative shrink-0 overflow-hidden rounded-full size-10 aspect-square">
      <NuxtImg
        :src="topicImage"
        tabindex="0"
        :alt="altText ?? topicTitle"
        width="40"
        height="40"
        class="block object-cover w-full h-full"
      />
    </div>
    <div class="stat-content">
      <span class="stat-label">{{ topicTitle }}</span>
      <span class="stat-value">{{ Math.min(topicProgress ?? 0, 100).toFixed(1) }}%</span>
    </div>
  </NuxtLink>

  <NuxtLink  v-else :to="topicTarget"
    @click="setTopicToView()" :class="[
      'relative flex overflow-hidden rounded-lg shadow-md group transition-all duration-500 ease-in-out min-w-[300px]',
      layoutEffect == 'grid' && modelType === 'card' ? 'flex-col lg:pb-4' : 'flex-row h-32',
      { 'cursor-pointer flex-row my-2 pb-0 md:h-20 !max-h-14 ': modelType === 'search' },
    ]"
    :aria-label="`Visit this page to learn more about topic of ${topicTitle}`"
    >
    <!-- topic image -->
    <div :class="[
      'relative overflow-hidden transition-all duration-500 ease-in-out',
      layoutEffect == 'grid' && modelType === 'card' ? 'h-56' : 'w-full max-w-[200px]',
      { 'md:h-20 !h-full max-w-[80px]': modelType === 'search', },
    ]">
      <NuxtImg :src="topicImage" tabindex="0" loading="lazy" :alt="altText ?? `Image of ${topicTitle}`" :class="[
        'object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110',
        { 'rounded-t-md': modelType === 'card', 'rounded-md': modelType === 'search' },
      ]" />
      <!-- topic standard -->
      <div v-if="modelType === 'card'" class="absolute right-0 -bottom-0">
        <div
          class="flex items-center justify-center w-auto h-8 duration-500 ease-in-out bg-oceanBlue group-hover:bg-deepBlue rounded-tl-md transition-color px-2">
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
          {{ Math.min(topicProgress ?? 0, 100).toFixed(1) }}%
        </span>
      </div>
      <!-- topic title and description -->
      <div class="flex flex-col my-auto transition-all duration-500 ease-in-out">
        <p :class="[
          'md:text-[1.2rem] font-bold text-gray-800 group-hover:text-white',
          { 'mt-2': !userToken, 'text-[1rem] font-medium': modelType === 'search' }
        ]">
          {{ topicTitle }}
        </p>
        <p v-if="modelType === 'card'" class="text-[1rem] text-black/80 group-hover:text-white line-clamp-2">
          {{ topicDescription }}
        </p>
      </div>

      <!-- topic subject name and metrics -->
      <div v-if="modelType === 'card'"
        class="flex items-center justify-between pt-2 pb-2 lg:pb-0 whitespace-nowrap text-extraSmall text-oceanBlue group-hover:text-white">
        <div class="flex items-center gap-2">
          <IconsMenuBook class="" :size="20"/>
          <p class="capitalize">{{ subjectName }}</p>
        </div>
        <!-- <div class="flex items-center gap-2">
                <Icon name="mdi-light:heart" class="text-medium" />
                <p class="">{{ calculateTopicMetrics(topicLikes) + " Likes" }}</p>
              </div> -->
        <div class="flex items-center gap-2">
          <IconsUsersViews :size="20"/>
          <p class="">{{ calculateTopicMetrics(topicViews) + " Views" }}</p>
        </div>
      </div>
    </div>
    <div>

      <!-- learn more -->
      <div v-if="modelType == 'card' && layoutEffect == 'grid'"
        class="absolute bottom-0 z-10 items-center justify-between hidden w-full h-10 px-4 text-white transition-all duration-500 ease-in-out opacity-0 lg:flex bg-gradient-to-b from-deepBlue to-gray-800 group-hover:opacity-100">
        <p class="capitalize text-small">{{primaryContentLanguage === 'kiswahili' ? 'Anza kujifunza' : 'Start learning'}}</p>
        <div class="flex items-center justify-center w-6 h-6 bg-white rounded-full animate-bounce-horizontal">
          <IconsArrowFilled :size="20" class="text-deepBlue" />
        </div>
      </div>
    </div>

    <!-- learn more -->
    <div v-if="modelType == 'card'"
      class="flex items-center justify-between w-full h-8 px-4 text-white lg:hidden bg-gradient-to-b from-deepBlue to-gray-800 ">
      <p class="capitalize text-small">{{primaryContentLanguage === 'kiswahili' ? 'Anza kujifunza' : 'Start learning'}}</p>
      <div class="flex items-center justify-center w-6 h-6 bg-white rounded-full animate-bounce-horizontal">
        <IconsArrowFilled :size="20" class="text-deepBlue" />
      </div>
    </div>
  </NuxtLink>
</template>
