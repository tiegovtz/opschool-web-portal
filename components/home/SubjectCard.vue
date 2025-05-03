<script setup>
import { layoutEffect } from "~/utilities/controlls";
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
  <button
    v-if="isLoggedIn"
    :class="[
      'relative flex  w-full  overflow-hidden transition-all duration-500 ease-in-out rounded-lg shadow-md group hover:bg-deepBlue',
      layoutEffect == 'grid' ? 'flex-col pb-4' : 'flex-row'
    ]"
    @click="setSubjectToView()">
    <!-- image -->
    <div :class="[
      'relative overflow-hidden transition-all duration-500 ease-in-out',
      layoutEffect == 'grid' ? 'h-56' : 'w-full max-w-[200px] h-32'
    ]">
      <NuxtImg
        :src="subjectImage"
        loading="lazy"
        alt="subject-image"
        class="object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110"
      />
    </div>

    <!-- content -->
    <div
      :class="[
        'flex px-4 pt-2 transition-all duration-500 ease-in-out group-hover:text-white',
        layoutEffect == 'grid' ? 'flex-wrap justify-between item-center' : 'flex-col  flex-1'
      ]">
      <!-- title & description -->
      <p
        class="flex text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out"
      >
        {{ subjectName }}
      </p>
      <!-- metrics -->
      <small 
        :class="[
          'flex items-center  gap-2  text-oceanBlue group-hover:text-white',
          layoutEffect == 'grid' ? 'justify-end p-2' : 'justify-start mt-auto pb-2'
        ]">
        <Icon name="flowbite:users-outline" class="text-medium" />
        <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
      </small>
    </div>
  </button>
  <!-- Is Logged In = False -->
  <NuxtLink
    v-else
    :to="`/interactive/${subjectName?.toLowerCase()}/${subjectId?.toLowerCase()}`"
    @click="setSubjectToView()"
    :class="[
      'relative flex  w-full  overflow-hidden transition-all duration-500 ease-in-out rounded-lg shadow-md group hover:bg-deepBlue',
      layoutEffect == 'grid' ? 'flex-col pb-4' : 'flex-row'
    ]">
    <!-- image -->
     <div :class="[
      'relative overflow-hidden transition-all duration-500 ease-in-out',
      layoutEffect == 'grid' ? 'h-56' : 'w-24 h-24'
    ]">
      <NuxtImg
        :src="subjectImage"
        loading="lazy"
        alt="subject-image"
        class="object-cover w-full h-full duration-1000 ease-in-out transform group-hover:scale-110"
      />
    </div>

    <!-- content -->
    <div
      :class="[
        'flex px-4 pt-2 transition-all duration-500 ease-in-out group-hover:text-white',
        layoutEffect == 'grid' ? 'flex-wrap justify-between item-center' : 'flex-col  flex-1'
      ]">
      <!-- title & description -->
      <p
        class="flex text-[1.2rem] font-bold text-gray-800 group-hover:text-white transition-all duration-500 ease-in-out"
      >
        {{ subjectName }}
      </p>
      <!-- metrics -->
      <small
        class="flex items-center justify-end gap-2 p-2 text-oceanBlue group-hover:text-white"
      >
        <Icon name="flowbite:users-outline" class="text-medium" />
        <p>{{ calculateTopicMetrics(totalViews) }} Views</p>
      </small>
    </div>
  </NuxtLink>
</template>
