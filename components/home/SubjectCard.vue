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
    class="relative overflow-hidden rounded-lg flex flex-col shadow-md pb-4 group hover:bg-deepBlue transition-all duration-500 ease-in-out"
  >
    <!-- image -->
    <div class="overflow-hidden relative h-56">
      <NuxtImg
        :src="subjectImage"
        loading="lazy"
        alt="subject-image"
        class="w-full h-full object-cover transform group-hover:scale-110 duration-1000 ease-in-out"
      />
    </div>

    <!-- content -->
    <div
      class="flex flex-wrap item-center justify-between group-hover:text-white transition-all duration-500 ease-in-out px-4 pt-2"
    >
      <!-- title & description -->
      <p
        class="flex text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out"
      >
        {{ subjectName }}
      </p>
      <!-- metrics -->
      <small :class="{ 'opacity-0': totalViews <= 0 }"
        class="flex justify-end p-2 items-center gap-2 text-oceanBlue group-hover:text-white">
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
    class="relative overflow-hidden rounded-lg flex flex-col shadow-md pb-4 group hover:bg-deepBlue transition-all duration-500 ease-in-out"
  >
    <!-- image -->
    <div class="overflow-hidden relative h-56">
      <NuxtImg
        :src="subjectImage"
        loading="lazy"
        alt="subject-image"
        class="w-full h-full object-cover transform group-hover:scale-110 duration-1000 ease-in-out"
      />
    </div>

    <!-- content -->
    <div
      class="flex flex-wrap item-center justify-between group-hover:text-white transition-all duration-500 ease-in-out px-4 pt-2"
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
        class="flex justify-end p-2 items-center gap-2 text-oceanBlue group-hover:text-white"
      >
        <Icon name="flowbite:users-outline" class="text-medium" />
        <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
      </small>
    </div>
  </NuxtLink>
</template>
