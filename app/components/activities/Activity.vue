<script setup lang="ts">
// @ts-nocheck
import type { AsyncDataRequestStatus } from '#app';
import type { ServerQuestionType } from '~/types/activity-props';
import { type Activity } from '~/types/activity-types';
import { enhancedActivityComponents } from '~/utilities/activityMapper/enhanced-mapper';
import activityPropsTranspiler from '~~/shared/transpilerMapper';
import type { ActivityType } from "~/types/activity-types";


// prpops
const props = withDefaults(defineProps<{ activityId: string }>(), {});
// states variable
const status = ref<AsyncDataRequestStatus>('idle');
const activity = ref<Activity>();
const error = ref<Error>();
const wrongQuestionsFormat = ref<boolean>(false);
const isMobile = useIsMobile()

const setWrongQuestionsFormat = (state:boolean)=>wrongQuestionsFormat.value = state; 

// load activity data
const fetchData = async () => {
    status.value = 'pending'
    error.value = undefined;
    try {
        const data = await $fetch<{ success: boolean; activity: Activity }>(`/api/primary/activities/${props.activityId}`);
        activity.value = data.activity;
        status.value = 'success';
    } catch (e) {
        error.value = e as any;
        activity.value = undefined;
        status.value = 'error';
        console.error(`[error while fetching activity info]:${error}`);
    }
}


// computed component to map
watch(
    () => props.activityId,
    async (value) => {
        if (!value) {
            activity.value = undefined;
            status.value = 'idle';
            return;
        }

        await fetchData();
    },
    { immediate: true }
)

// preparing component
const activityComponent = computed(() => activity.value && enhancedActivityComponents[activity.value?.description])

// transplier
const transpiler = computed(() => activity.value && activityPropsTranspiler[activity.value.description])
</script>
<template>
    <div>
        <div v-if="status === 'idle'"> Nothing to show </div>
        <div v-else-if="status == 'pending'">Loading ...</div>
        <div v-else-if="status == 'success'" class="">
            <div v-if="!activity || !transpiler" class="">
                 This activity is not available
            </div>
            <component
              :is="activityComponent"
              v-bind="props"
              feedback="wrong-correct"
              :questions="(transpiler?.({
                setWrongQuestionsFormat,
                summary: (activity?.summary as string),
                algorithm: (activity?.description as ActivityType),
                summaryPath: (activity?.summaryPath as string),
                serverQuestions: (activity?.questions as ServerQuestionType[]),
                titleDescription: (activity?.activityDescription as string),
                isMobile,
              }) ?? {})"
            />
        </div>
        <div v-else-if="status == 'error'">{{ error }}</div>
        <div v-else> unknown issue occurred </div>
    </div>
</template>
