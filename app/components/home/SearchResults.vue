<script setup lang="ts">
import { useNavigationStore } from "~/stores/navigationStore";
import type { LanguageSupport } from "~/types/language.interface";
import {
    getEducationHubBucket,
    getEducationRouteQuery,
    normalizeEducationLevel,
} from "~/utilities/educationRoute";
// Define Stores
const navigationStore = useNavigationStore()

// Define Props 
const props = withDefaults(defineProps<{
    id:string,
    title:string,
    thumbnail?: string,
    level:string,
    subject: string,
    type:string,
    educationLevel?: string,
    searchEducationLevel?: string,
    language?: LanguageSupport,
}>(),{
    thumbnail:'/images/background2.webp',
    language: 'english',
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

const resolvedEducationLevel = computed(() => {
    const explicitEducationLevel = getEducationHubBucket(props.educationLevel)
        ? props.educationLevel
        : undefined;
    const searchEducationLevel = getEducationHubBucket(props.searchEducationLevel)
        ? props.searchEducationLevel
        : undefined;

    return normalizeEducationLevel(
        explicitEducationLevel ??
        searchEducationLevel ??
        props.level,
    );
});

const pageTarget = computed(() => ({
    path: `/${pageToView.value}/${props.level}/${props.subject}/${props.title}/${props.id}`,
    query: getEducationRouteQuery(
        resolvedEducationLevel.value,
        {},
        props.language,
    ),
}));

const rememberedRoute = computed(() => {
    const params = new URLSearchParams(
        pageTarget.value.query as Record<string, string>,
    ).toString();

    return `${pageTarget.value.path}${params ? `?${params}` : ""}`;
});

const setPageToView = () => {
    if (props.type.toLocaleLowerCase() === 'topic') {
        navigationStore.setTopic(rememberedRoute.value)
    }
    if (props.type.toLocaleLowerCase() === 'activity') {
        navigationStore.setExperiment(rememberedRoute.value)
    }
    if (props.type.toLocaleLowerCase() === 'video') {
        navigationStore.setVideo(rememberedRoute.value)
    }
    if (props.type.toLocaleLowerCase() === 'audio') {
        navigationStore.setAudio(rememberedRoute.value)
    }
}
</script>

<template>
    <NuxtLink role="navigation" :aria-label="`Go to ${title}`" @click="setPageToView()"
        :to="pageTarget"
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
