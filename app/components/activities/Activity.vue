<script setup lang="ts">
// @ts-nocheck
import type { AsyncDataRequestStatus } from '#app';
import type { ServerQuestionType } from '~/types/activity-props';
import { type Activity } from '~/types/activity-types';
import { enhancedActivityComponents } from '~/utilities/activityMapper/enhanced-mapper';
import activityPropsTranspiler from '~~/shared/transpilerMapper';
import type { ActivityType } from "~/types/activity-types";
import apiDocs from "~/utilities/apiDocs";
import {
  getApiContentLanguage,
  resolveEducationLevelFromRoute,
  resolveRouteLanguage,
} from "~/utilities/educationRoute";
import {
  activityAuthHeaders,
  extractActivityFromPayload,
  normalizeActivity,
} from "~/utilities/activitiesApi";
import { Icon } from "@iconify/vue";


// prpops
const props = withDefaults(defineProps<{ activityId: string }>(), {});
// states variable
const status = ref<AsyncDataRequestStatus>('idle');
const activity = ref<Activity>();
const error = ref<Error>();
const wrongQuestionsFormat = ref<boolean>(false);
const isMobile = useIsMobile()
const route = useRoute();
const primaryContentLanguage = usePrimaryContentLanguage();
const ui = useActivityUiText();
const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const contentLanguage = computed(() =>
  resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
);
const apiLanguage = computed(() =>
  getApiContentLanguage(educationLevel.value, contentLanguage.value),
);

const setWrongQuestionsFormat = (state:boolean)=>wrongQuestionsFormat.value = state; 

// load activity data
const fetchData = async () => {
    status.value = 'pending'
    error.value = undefined;
    try {
        const response = await $fetch(
          apiDocs.activities.getActivityId.replace("{id}", props.activityId),
          {
            headers: activityAuthHeaders(),
            query: apiLanguage.value
              ? { language: apiLanguage.value }
              : undefined,
          }
        );

        const normalizedActivity = normalizeActivity(
          extractActivityFromPayload(response)
        );

        if (!normalizedActivity) {
          throw new Error("Activity payload is invalid.");
        }

        activity.value = normalizedActivity as Activity;
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
    () => [props.activityId, apiLanguage.value],
    async ([value]) => {
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
        <div v-if="status === 'idle'">{{ ui.nothingToShow }}</div>
        <div
          v-else-if="status == 'pending'"
          class="flex min-h-[260px] flex-col items-center justify-center gap-4 px-4 text-center"
        >
          <div class="relative">
            <span
              class="absolute -inset-8 animate-ping rounded-full bg-oceanBlue opacity-70"
            />
            <span
              class="absolute -inset-6 rounded-full bg-sky-50 opacity-60 blur-sm"
            />
            <Icon
              icon="heroicons:sparkles"
              width="40"
              height="40"
              class="relative text-oceanBlue animate-bounce"
            />
          </div>

          <p class="text-lg font-semibold text-oceanBlue/90">{{ ui.loading }}</p>
        </div>
        <div v-else-if="status == 'success'" class="">
            <div v-if="!activity || !transpiler" class="">
                 {{ ui.activityUnavailable }}
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
        <div v-else>{{ ui.unknownIssue }}</div>
    </div>
</template>
