<script setup lang="ts">
import { layoutEffect } from "~/utilities/controlls";
import { calculateTopicMetrics } from "~/utilities/topicMetrics.js";
import {
  getEducationRouteQuery,
  normalizeEducationLevel,
  resolveRouteLanguage,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";

// Define Props
const props = withDefaults(defineProps<{
  subjectId: string;
  subjectName: string,
  subjectImage?: string,
  subjectDescription: string,
  subjectEducationLevel?: string,
  totalViews: number,
  isLoggedIn: boolean,
  altText?: string

}>(), {
  totalViews: 0,
  isLoggedIn: false,
  subjectImage: '/images/background2.webp'
});

const route = useRoute();
const primaryContentLanguage = usePrimaryContentLanguage();
const educationLevelBadge = computed(() => {
  if (!(props?.subjectEducationLevel as string)?.trim()) return "";

  switch (normalizeEducationLevel(props.subjectEducationLevel, "primary")) {
    case "pre-primary":
      return "Pre-Primary";
    case "primary":
      return "Primary";
    case "lower secondary":
      return "Lower Secondary";
    case "upper secondary":
      return "Upper Secondary";
    default:
      return props.subjectEducationLevel;
  }
});
const subjectTarget = computed(() => ({
  path: `/interactive/${props.subjectName?.toLowerCase()}/${props.subjectId?.toLowerCase()}`,
  query: getEducationRouteQuery(
    resolveEducationLevelFromRoute(route),
    {},
    resolveRouteLanguage(route, undefined, primaryContentLanguage.value),
  ),
}));

// Define Emits
const emit = defineEmits([
  'emitSubjectName', 'emitSubjectId'
])

// Define Function
const setSubjectToView = () => {
  useState(
    "subjectToView",
    () =>
      `/interactive/${props.subjectName?.toLowerCase()}/${props.subjectId?.toLowerCase()}`
  );
  useState("subjectName", () => props.subjectName);

  emit(
    'emitSubjectName',
    props.subjectName,
  );
  emit(
    'emitSubjectId',
    props.subjectId,
  );

};
</script>

<template>
  <button v-if="isLoggedIn" :class="[
    'relative flex  w-full  overflow-hidden transition-all duration-500 ease-in-out rounded-lg shadow-md group hover:bg-deepBlue',
    layoutEffect == 'grid' ? 'flex-col pb-4' : 'flex-row'
  ]" @click="setSubjectToView()" :aria-label="`View ${subjectName} subject: ${subjectDescription}`">
    <!-- image -->
    <div :class="[
      'relative overflow-hidden transition-all duration-500 ease-in-out',
      layoutEffect == 'grid' ? 'h-[280px]' : 'w-full max-w-[200px] h-32'
    ]">
      <NuxtImg :src="subjectImage" loading="lazy" tabindex="0" :alt="altText ?? `Image for ${subjectName} subject`"
        class="object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110" />
    </div>

    <!-- content -->
    <div :class="[
      'flex px-4 pt-2 transition-all duration-500 ease-in-out group-hover:text-white',
      layoutEffect == 'grid' ? 'flex-col' : 'flex-col flex-1'
    ]">

      <!-- title and metrics -->
      <div :class="[
        'flex justify-between items-start transition-all duration-500 ease-in-out group-hover:text-white w-full',
      ]">
        <div class="flex min-w-0 flex-col gap-2">
          <p
            class="text-left text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out">
            {{ subjectName }}
          </p>
        </div>
      </div>

      <!-- description -->
      <p class="text-start text-small text-black/80 group-hover:text-white line-clamp-2">
        {{ subjectDescription }}
      </p>

      <!-- metrics  and level-->
       <div class="flex items-center justify-between">
         <small
          v-if="educationLevelBadge"
          class="inline-flex w-fit rounded-full bg-sky-100 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-sky-700 transition-all duration-500 ease-in-out group-hover:bg-white/15 group-hover:text-white"
        >
          {{ educationLevelBadge }}
        </small>


      <small
        class="flex items-center justify-end gap-2 p-2 text-oceanBlue group-hover:text-white"
      >
        <Icon name="flowbite:users-outline" class="text-medium" aria-hidden="true" />
        <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
      </small>
       </div>
    </div>
  </button>
  <!-- Is Logged In = False -->
  <NuxtLink v-else :to="subjectTarget" @click="setSubjectToView()" :class="[
    'relative flex  w-full  overflow-hidden transition-all duration-500 ease-in-out rounded-lg shadow-md group hover:bg-deepBlue',
    layoutEffect == 'grid' ? 'flex-col pb-4' : 'flex-row'
  ]" :aria-label="`View ${subjectName} subject: ${subjectDescription}`">
    <!-- image -->
    <div :class="[
      'relative overflow-hidden transition-all duration-500 ease-in-out',
      layoutEffect == 'grid' ? 'h-56' : 'w-24 h-24'
    ]">
      <NuxtImg :src="subjectImage" loading="lazy" tabindex="0" :alt="`Image for ${subjectName} subject`"
        class="object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110" />
    </div>

    <!-- content -->
    <div :class="[
      'flex px-4 pt-2 transition-all duration-500 ease-in-out group-hover:text-white flex-col',
      layoutEffect == 'grid' ? 'justify-between item-center' : 'flex-1'
    ]">
      <!-- title & description -->
      <div class="flex min-w-0 flex-col gap-2">
        <p
          class="flex text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out">
          {{ subjectName }}
        </p>

      </div>
      <!-- metrics  and level-->
      <div class="flex items-center justify-between">
        <small v-if="educationLevelBadge"
          class="inline-flex w-fit rounded-full bg-sky-100 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-sky-700 transition-all duration-500 ease-in-out group-hover:bg-white/15 group-hover:text-white">
          {{ educationLevelBadge }}
        </small>


        <small class="flex items-center justify-end gap-2 p-2 text-oceanBlue group-hover:text-white">
          <Icon name="flowbite:users-outline" class="text-medium" aria-hidden="true" />
          <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
        </small>
      </div>
    </div>
  </NuxtLink>
</template>
