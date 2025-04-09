<script setup>
import { calculateTopicMetrics } from "~/utilities/topicMetrics.js";

// Define Props
const props = defineProps({
  subjectId: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  subjectImage: {
    type: String,
    default: '/images/background2.webp'
  },
  totalViews: {
    type: Number,
    default: 0,
  },

  isLoggedIn: {
    type: Boolean,
    default: false,
  },
});

// Define Emits
const emit = defineEmits([
  'emitSubjectName'
])

// Define Function
const setSubjectToView = () => {
  useState(
    "subjectToView",
    () =>
      `/interactive/${props.subjectName.toLowerCase()}/${props.subjectId.toLowerCase()}`
  );
  useState("subjectName", () => props.subjectName);

  emit(
    'emitSubjectName',
    props.subjectName
  )
};
</script>

<template>
  <!-- Is Logged In = True -->
  <button
    v-if="isLoggedIn"
    @click="setSubjectToView()"
    class="relative flex flex-col pb-4 overflow-hidden transition-all duration-500 ease-in-out rounded-lg shadow-md group hover:bg-deepBlue"
  >
    <!-- image -->
    <div class="relative h-56 overflow-hidden">
      <NuxtImg
        :src="subjectImage"
        loading="lazy"
        alt="subject-image"
        class="object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110"
      />
    </div>

    <!-- content -->
    <div
      class="flex flex-wrap justify-between px-4 pt-2 transition-all duration-500 ease-in-out item-center group-hover:text-white"
    >
      <!-- title & description -->
      <p
        class="flex text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out"
      >
        {{ subjectName }}
      </p>
      <!-- metrics -->
      <small :class="{ 'opacity-0': totalViews <= 0 }"
        class="flex items-center justify-end gap-2 p-2 text-oceanBlue group-hover:text-white">
        <Icon name="flowbite:users-outline" class="text-medium" />
        <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
      </small>
    </div>
  </button>
  <!-- Is Logged In = False -->
  <NuxtLink
    v-else
    :to="`/interactive/${subjectName.toLowerCase()}/${subjectId.toLowerCase()}`"
    @click="setSubjectToView()"
    class="relative flex flex-col pb-4 overflow-hidden transition-all duration-500 ease-in-out rounded-lg shadow-md group hover:bg-deepBlue"
  >
    <!-- image -->
    <div class="relative h-56 overflow-hidden">
      <NuxtImg
        :src="subjectImage"
        loading="lazy"
        alt="subject-image"
        class="object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110"
      />
    </div>

    <!-- content -->
    <div
      class="flex flex-wrap justify-between px-4 pt-2 transition-all duration-500 ease-in-out item-center group-hover:text-white"
    >
      <!-- title & description -->
      <p
        class="flex text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out"
      >
        {{ subjectName }}
      </p>
      <!-- metrics -->
      <small
        :class="{ 'opacity-0': totalViews <= 0 }"
        class="flex items-center justify-end gap-2 p-2 text-oceanBlue group-hover:text-white"
      >
        <Icon name="flowbite:users-outline" class="text-medium" />
        <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
      </small>
    </div>
  </NuxtLink>
</template>
