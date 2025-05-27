<script setup>
// Define Stores
const navigationStore = useNavigationStore()

// Define Props
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: '/images/background2.webp',
  },
  level: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const pageToView =  computed(() => {
let page;
if (props.type.toLocaleLowerCase() === 'topic') {
    page = 'interactive';
  } else if (props.type.toLocaleLowerCase() === 'activity') {
    page = 'experiment';
  } else if (props.type.toLocaleLowerCase() === 'video') {
    page = 'video';
  } else if (props.type.toLocaleLowerCase() === 'audio') {
    page = 'audio';
  } else {
    page = 'topic';
  }
  return page;
});

const setPageToView = () => {
    if (props.type.toLocaleLowerCase() === 'topic') {
        navigationStore.setTopic(`/${pageToView.value}/${props.level}/${props.subject}/${props.title}/${props.id}`)
    }
    if (props.type.toLocaleLowerCase() === 'activity') {
        navigationStore.setExperiment(`/${pageToView.value}/${props.level}/${props.subject}/${props.title}/${props.id}`)
    }
    if (props.type.toLocaleLowerCase() === 'video') {
        navigationStore.setVideo(`/${pageToView.value}/${props.level}/${props.subject}/${props.title}/${props.id}`)
    }
    if (props.type.toLocaleLowerCase() === 'audio') {
        navigationStore.setAudio(`/${pageToView.value}/${props.level}/${props.subject}/${props.title}/${props.id}`)
    }
}
</script>

<template>
  <NuxtLink
  @click="setPageToView()"
  :to="`/${pageToView}/${level}/${subject}/${title}/${id}`"
  class="flex items-center p-4 transition-shadow duration-500 ease-in-out bg-white rounded-lg shadow-md hover:shadow-lg">
    <div class="max-w-[100px] h-20 mb-4 overflow-hidden rounded-md">
      <NuxtImg :src="thumbnail" loading="lazy" :alt="'Image of ' + thumbnail" class="object-cover w-full h-full" />
    </div>
   <div class="flex flex-col justify-between flex-1 ml-4">
    <h2 class="mb-2 text-xl font-semibold">{{ title }}</h2>
    <p class="mb-2 text-gray-600"> {{ level }}</p>
    <p class="mb-2 text-gray-600"> {{ subject }}</p>
    <Icon
      :icon="[
        {'chevron-right' : type.toLocaleLowerCase() === 'topic'},
        {'play-circle' : type.toLocaleLowerCase() === 'activity'},
        {'video-camera' : type.toLocaleLowerCase() === 'video'},
        {'headphones' : type.toLocaleLowerCase() === 'audio'}
        ]"
      class="text-gray-500 transition-transform duration-300 ease-in-out transform hover:translate-x-1" />
   </div>
  </NuxtLink>
</template>
