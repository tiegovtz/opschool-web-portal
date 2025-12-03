<script setup lang="ts">
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

const pageToView = computed(() => {
    let page;
    if (props.type.toLocaleLowerCase() === 'topic') {
        page = 'interactive';
    } else if (props.type.toLocaleLowerCase() === 'activity') {
        page = 'experiments';
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
    <NuxtLink role="navigation" :aria-label="`Go to ${title}`" @click="setPageToView()"
        :to="`/${pageToView}/${level}/${subject}/${title}/${id}`"
        class="flex items-center p-4 transition-shadow duration-500 ease-in-out bg-white rounded-lg shadow-md hover:shadow-lg">
        <div class="max-w-[100px] h-20 mb-4 overflow-hidden rounded-md" tabindex="0">
            <NuxtImg :src="thumbnail" loading="lazy" :alt="'Image of ' + subject + ' for ' + title"
                class="object-cover w-full h-full" />
        </div>
        <div class="flex flex-col justify-between flex-1 ml-4">
            <h2 class="mb-2 text-xl font-semibold" :aria-label="props.title" tabindex="0">{{ title }}</h2>
            <div class="flex items-center gap-4">
                <p class="text-gray-600 " :aria-label="props.subject + ' - ' + props.level" tabindex="0">
                    {{ subject }} - {{ level }}
                </p>
                <Icon
                    :name="type.toLocaleLowerCase() === 'topic' ? 'mdi:notebook-edit' :
                        type.toLocaleLowerCase() === 'activity' ? 'icon-park-solid:experiment-one' :
                            type.toLocaleLowerCase() === 'video' ? 'fluent:video-24-filled' :
                                type.toLocaleLowerCase() === 'audio' ? 'famicons:headset-sharp' : 'icon-park-solid:blackboard'"
                    class="text-gray-500 transition-transform duration-300 ease-in-out transform hover:translate-x-1"
                    tabindex="0" :aria-label="type.toLocaleLowerCase() === 'topic' ? 'note book and pen icon' :
                        type.toLocaleLowerCase() === 'activity' ? 'conical flask icon' :
                            type.toLocaleLowerCase() === 'video' ? 'video icon' :
                                type.toLocaleLowerCase() === 'audio' ? 'headset icon' : 'blackboard icon'" aria-hidden="true"
                    focusable="false" />
            </div>
        </div>
    </NuxtLink>
</template>
