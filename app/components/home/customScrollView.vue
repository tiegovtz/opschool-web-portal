<script setup lang="ts">
import customGridOne from "~/components/home/customGridOne.vue";
import customGridTwo from "~/components/home/customGridTwo.vue";
import ExperimentsCard from "~/components/experiments/experimentsCard.vue";
import TopicCard from "~/components/home/TopicCard.vue";
import SubjectCard from "~/components/home/SubjectCard.vue";
import { VideoCard } from "#components";
import { layoutEffect } from "~/utilities/controlls";
import AudioCard from "../audio/audioCard.vue";
import type { tabs } from "~/types/types.data";
import type { Topic } from "~/types/topic.interface";
import type { Experiment } from "~/types/experiment.interface";
import type { Videos } from "~/types/video.interface";
import type { Audios } from "~/types/audio.interface";
import type { Subjects } from "~/types/subject.interface";
import type { LanguageSupport } from "~/types/language.interface";

const emits = defineEmits([
  "emittedSubjectId",
  "emittedActiveTab",
  "emittedSubjectName",
]);

const props = defineProps<{
  data: any[];
  activeTab: tabs;
  seeMoreDetails?: string;
  shuffleSubject?: Function;
  educationLevel?: string;
  language?: LanguageSupport;
}>();

type GroupedCollection<T = any> = {
  dataOfKey: string | null;
  data: T[];
};

const seeMoreDetails = ref<string | null>(props.seeMoreDetails ?? null); // Initial See More
const userToken = useCookie("signInUserToken");

const normalizedGroups = computed<GroupedCollection[]>(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) return [];

  const isGroupedCollection = props.data.every((item) =>
    Array.isArray(item?.data),
  );

  if (isGroupedCollection) {
    return props.data as GroupedCollection[];
  }

  return [
    {
      dataOfKey: null,
      data: props.data,
    },
  ];
});

const hasMultipleGroups = computed(() => normalizedGroups.value.length > 1);

const showGroupHeader = (group: GroupedCollection) =>
  hasMultipleGroups.value || !!group?.dataOfKey;

// modify see more
const setSeeMore = (seeMore: string) => {
  if (seeMoreDetails.value === seeMore) {
    seeMoreDetails.value = null;
  } else {
    seeMoreDetails.value = seeMore;
  }
};

// general level
const currentLevel = ref<Record<string, string>>({});
const getLevels = (data: any[]) => {
  // extracting levels
  let list = data?.map((t: any) => (t?.level as any).name || t?.level);
  return new Set(list);
};

const setLevel = (key: string, lvl: string) => {
  currentLevel.value = {
    ...currentLevel.value,
    [key]: lvl,
  };
};
</script>

<template>
  <div v-if="userToken">
    <div
      id="main-container"
      tabindex="-1"
      v-if="activeTab === 'subjects'"
    >
      <!-- Subject Cards are in Grid -->
      <customGridOne
        active-tab="subjects"
        v-if="activeTab === 'subjects'"
      >
        <template #data>
          <!-- Subject Cards are in Grid -->
          <SubjectCard
            v-for="subject in shuffleSubject?.(data)"
            :key="subject._id"
            :subject-id="subject._id"
            :subject-name="subject.name"
            :subject-image="subject.thumbnail"
            :subject-description="subject.description"
            :subject-education-level="subject.educationLevel || (subject.educationLevel as any)?.name"
            :total-views="subject.views ?? 0"
            :alt-text="subject.alt"
            :is-logged-in="userToken != null || userToken != undefined"
            @emit-subject-name="emits('emittedSubjectName', $event)"
            @emit-subject-id="emits('emittedSubjectId', $event)"
          />
        </template>
      </customGridOne>
    </div>

    <!-- topic after login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'interactive-contents'"
    >
      <div
        v-for="(topics, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(topics) &&
            seeMoreDetails &&
            seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
          "
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ (topics?.dataOfKey as any)?.toLowerCase() }}
          </h2>

          <div class="flex items-center gap-2">
            <CustomDropDownList
              v-if="Array.from(getLevels(topics.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(topics?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(topics.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />

            <small
              @click="setSeeMore((topics?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
              :aria-label="
                seeMoreDetails &&
                seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
                  ? `See less ${(topics?.dataOfKey as any)?.toLowerCase()}`
                  : `See all ${(topics?.dataOfKey as any)?.toLowerCase()}`
              "
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>
        <div
          v-else-if="showGroupHeader(topics) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (topics?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(topics.data)"
              :key="`levels-${(topics?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((topics?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl }}</small> -->

            <CustomDropDownList
              v-if="Array.from(getLevels(topics.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(topics?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(topics.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />

            <small
              @click="setSeeMore((topics?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>

        <div v-if="hasMultipleGroups">
          <customGridOne
            v-if="
              seeMoreDetails &&
              seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
            "
          >
            <template #data>
              <!-- Topic Cards  -->
              <TopicCard
                v-for="topic in (() => {
                  const key = (topics?.dataOfKey as any)?.toLowerCase();
                  return currentLevel[key]
                    ? (topics?.data as Topic[]).filter(
                        (t) => (t.level as any)?.name === currentLevel[key],
                      )
                    : (topics?.data as Topic[]);
                })()"
                :key="topic._id"
                :topic-id="topic._id"
                :topic-image="topic.thumbnail"
                :topic-title="topic.name"
                :topic-description="topic.descriptions"
                :subject-name="(topic.subject as any)?.name"
                :topic-views="
                  topic.viewedBy?.length
                    ? topic.viewedBy?.length
                    : topic.views
                      ? topic.views
                      : 0
                "
                :topic-standard="(topic.level as any)?.name"
                :topic-viewed="topic.isViewed"
                :topic-progress="topic.avgProgress"
                :alt-text="topic.alt"
              />
            </template>
          </customGridOne>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <!-- Topic Cards  -->
            <TopicCard
              v-for="topic in (() => {
                const key = (topics?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (topics?.data as Topic[]).filter(
                      (t) => (t.level as any)?.name === currentLevel[key],
                    )
                  : (topics?.data as Topic[]);
              })()"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                    ? topic.views
                    : 0
              "
              :topic-standard="(topic.level as any)?.name"
              :subject-name="(topic.subject as any)?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
              :alt-text="topic.alt"
            />
          </div>
        </div>

        <customGridOne v-else>
          <template #data>
            <!-- Topic Cards  -->
            <TopicCard
              v-for="topic in (() => {
                const key = (topics?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (topics?.data as Topic[]).filter(
                      (t) => (t.level as any)?.name === currentLevel[key],
                    )
                  : (topics?.data as Topic[]);
              })()"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                    ? topic.views
                    : 0
              "
              :topic-standard="(topic.level as any)?.name"
              :subject-name="(topic.subject as any)?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
              :alt-text="topic.alt"
            />
          </template>
        </customGridOne>
      </div>
    </div>

    <!-- experiments after login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'learn-activities'"
    >
      <div
        v-for="(experiments, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(experiments) &&
            seeMoreDetails &&
            seeMoreDetails === (experiments?.dataOfKey as any)?.toLowerCase()
          "
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (experiments?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore((experiments?.dataOfKey as any)?.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            role="button"
            tabindex="0"
            :aria-label="`See less ${(experiments?.dataOfKey as any)?.toLowerCase()} experiments`"
          >
            {{
              seeMoreDetails &&
              seeMoreDetails === (experiments?.dataOfKey as any)?.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(experiments) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (experiments?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(experiments.data)"
              :key="`levels-${(experiments?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((experiments?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl
              }}</small> -->

            <CustomDropDownList
              v-if="Array.from(getLevels(experiments.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="
                currentLevel[(experiments?.dataOfKey as any)?.toLowerCase()]
              "
              placeholder="select class level"
              :list="
                Array.from(getLevels(experiments.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />
            <small
              @click="
                setSeeMore((experiments?.dataOfKey as any)?.toLowerCase())
              "
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails ===
                  (experiments?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>

        <div v-if="hasMultipleGroups">
          <customGridOne
            v-if="
              seeMoreDetails &&
              seeMoreDetails === (experiments?.dataOfKey as any)?.toLowerCase()
            "
          >
            <template #data>
              <!-- Experiment Cards  -->
              <ExperimentsCard
                v-for="experiment in (() => {
                  const key = (experiments?.dataOfKey as any)?.toLowerCase();
                  return currentLevel[key]
                    ? (experiments?.data as Experiment[]).filter(
                        (e) => (e.level as any)?.name === currentLevel[key],
                      )
                    : (experiments?.data as Experiment[]);
                })()"
                :key="experiment._id"
                :experiment-id="experiment._id"
                :experiment-thumbnail="experiment.thumbnail"
                :experiment-description="experiment.description"
                :experiment-type="experiment.category"
                :experiment-subject="(experiment.subject as any)?.name"
                :experiment-level="(experiment.level as any)?.name"
                :experiment-name="experiment.name"
                :experiment-file-url="experiment.stepsFileUrl"
                :alt-text="experiment.alt"
              />
            </template>
          </customGridOne>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <!-- Experiment Cards  -->
            <ExperimentsCard
              v-for="experiment in (() => {
                const key = (experiments?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (experiments?.data as Experiment[]).filter(
                      (e) => (e.level as any)?.name === currentLevel[key],
                    )
                  : (experiments?.data as Experiment[]);
              })()"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="(experiment.subject as any)?.name"
              :experiment-level="(experiment.level as any)?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
              :alt-text="experiment.alt"
            />
          </div>
        </div>
        <customGridOne v-else>
          <template #data>
            <!-- Experiments Cards  -->
            <ExperimentsCard
              v-for="experiment in (() => {
                const key = (experiments?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (experiments?.data as Experiment[]).filter(
                      (e) => (e.level as any)?.name === currentLevel[key],
                    )
                  : (experiments?.data as Experiment[]);
              })()"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="(experiment.subject as any)?.name"
              :experiment-level="(experiment.level as any)?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
              :alt-text="experiment.alt"
            />
          </template>
        </customGridOne>
      </div>
    </div>
    <!-- video after login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'video' || activeTab === 'class-videos'"
    >
      <div
        v-for="(videos, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(videos) &&
            seeMoreDetails &&
            seeMoreDetails === (videos?.dataOfKey as any)?.toLowerCase()
          "
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ (videos?.dataOfKey as any)?.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore((videos?.dataOfKey as any)?.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            role="button"
            tabindex="0"
            :aria-label="`See less ${(videos?.dataOfKey as any)?.toLowerCase()} videos`"
          >
            {{
              seeMoreDetails &&
              seeMoreDetails === (videos?.dataOfKey as any)?.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(videos) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (videos?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(videos.data)"
              :key="`levels-${(videos?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((videos?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl }}</small> -->

            <CustomDropDownList
              v-if="Array.from(getLevels(videos.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(videos?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(videos.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />
            <small
              @click="setSeeMore((videos?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (videos?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>
        <div v-if="hasMultipleGroups">
          <customGridOne
            v-if="
              seeMoreDetails &&
              seeMoreDetails === (videos?.dataOfKey as any)?.toLowerCase()
            "
          >
            <template #data>
              <!-- Video Cards  -->
              <VideoCard
                v-for="video in (() => {
                  const key = (videos?.dataOfKey as any)?.toLowerCase();
                  return currentLevel[key]
                    ? (videos?.data as Videos[]).filter(
                        (v) => (v.level as any)?.name === currentLevel[key],
                      )
                    : (videos?.data as Videos[]);
                })()"
                :key="video._id"
                :video-id="video._id"
                :is-deleted="video.isDeleted as boolean"
                :video-name="video.name"
                :video-thumbnail="video.thumbnail"
                :video-file-url="video.videoFileUrl"
                :video-description="video.description"
                :video-subject="(video.subject as any)?.name"
                :video-type="video.videoType"
                :video-level="(video.level as any)?.name"
                :video-standard="(video.level as any)?.name"
                :topic-progress="video.avgProgress as number"
                :topic-viewed="video.isViewed as boolean"
                :alt-text="video.alt"
              />
            </template>
          </customGridOne>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <VideoCard
              v-for="video in (() => {
                const key = (videos?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (videos?.data as Videos[]).filter(
                      (v) => (v.level as any)?.name === currentLevel[key],
                    )
                  : (videos?.data as Videos[]);
              })()"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted as boolean"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="(video.subject as any)?.name"
              :video-type="video.videoType"
              :video-level="(video.level as any)?.name"
              :video-standard="(video.level as any)?.name"
              :topic-progress="(video.avgProgress as number)"
              :topic-viewed="(video.isViewed as boolean)"
              :alt-text="video.alt"
            />
          </div>
        </div>
        <customGridOne v-else>
          <template #data>
            <!-- Video Cards  -->
            <VideoCard
              v-for="video in (() => {
                const key = (videos?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (videos?.data as Videos[]).filter(
                      (v) => (v.level as any)?.name === currentLevel[key],
                    )
                  : (videos?.data as Videos[]);
              })()"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted as boolean"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="(video.subject as any)?.name"
              :video-type="video.videoType"
              :video-level="(video.level as any)?.name"
              :video-standard="(video.level as any)?.name"
              :topic-progress="video.avgProgress as number"
              :topic-viewed="video.isViewed as boolean"
              :alt-text="video.alt"
            />
          </template>
        </customGridOne>
      </div>
    </div>

    <!-- audios after login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'audio'"
    >
      <div
        v-for="(audios, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(audios) &&
            seeMoreDetails &&
            seeMoreDetails === (audios?.dataOfKey as any)?.toLowerCase()
          "
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (audios?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore((audios?.dataOfKey as any)?.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            role="button"
            tabindex="0"
            :aria-label="`See less ${(audios?.dataOfKey as any)?.toLowerCase()} audio files`"
          >
            {{
              seeMoreDetails &&
              seeMoreDetails === (audios?.dataOfKey as any)?.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(audios) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (audios?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(audios.data)"
              :key="`levels-${(audios?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((audios?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl }}</small> -->

            <CustomDropDownList
              v-if="Array.from(getLevels(audios.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(audios?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(audios.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />
            <small
              @click="setSeeMore((audios?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (audios?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>
        <div v-if="hasMultipleGroups">
          <customGridOne
            v-if="
              seeMoreDetails &&
              seeMoreDetails === (audios?.dataOfKey as any)?.toLowerCase()
            "
          >
            <template #data>
              <!-- audio Cards  -->
              <AudioCard
                v-for="audio in (() => {
                  const key = (audios?.dataOfKey as any)?.toLowerCase();
                  return currentLevel[key]
                    ? (audios?.data as Audios[]).filter(
                        (a) => (a.level as any)?.name === currentLevel[key],
                      )
                    : (audios?.data as Audios[]);
                })()"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
                :alt-text="audio.alt"
              />
            </template>
          </customGridOne>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <AudioCard
              v-for="audio in (() => {
                const key = (audios?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (audios?.data as Audios[]).filter(
                      (a) => (a.level as any)?.name === currentLevel[key],
                    )
                  : (audios?.data as Audios[]);
              })()"
              :key="audio._id"
              :audio-id="audio._id"
              :is-deleted="audio.isDeleted"
              :audio-name="audio.name"
              :audio-thumbnail="audio.thumbnail"
              :audio-file-url="audio.audioFileUrl"
              :audio-description="audio.description"
              :audio-subject="audio.subject?.name"
              :audio-type="audio.audioType"
              :alt-text="audio.alt"
            />
          </div>
        </div>
        <customGridOne v-else>
          <template #data>
            <!-- Video Cards  -->
            <AudioCard
              v-for="audio in (() => {
                const key = (audios?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (audios?.data as Audios[]).filter(
                      (a) => (a.level as any)?.name === currentLevel[key],
                    )
                  : (audios?.data as Audios[]);
              })()"
              :key="audio._id"
              :audio-id="audio._id"
              :is-deleted="audio.isDeleted"
              :audio-name="audio.name"
              :audio-thumbnail="audio.thumbnail"
              :audio-file-url="audio.audioFileUrl"
              :audio-description="audio.description"
              :audio-subject="audio.subject?.name"
              :audio-type="audio.audioType"
              :alt-text="audio.alt"
            />
          </template>
        </customGridOne>
      </div>
    </div>

    <!-- fallback message -->
    <div
      id="main-container"
      tabindex="-1"
      v-else
    >
      <MessageTopicNotFound message="This page will be updated soon" />
    </div>
  </div>
  <div v-else>
    <div
      id="main-container"
      tabindex="-1"
      v-if="activeTab === 'subjects'"
    >
      <!-- Subject Cards are in Grid -->
      <customGridTwo v-if="activeTab === 'subjects'">
        <template #data>
          <!-- Subject Cards are in Grid -->
          <SubjectCard
            v-for="subject in (data as unknown as Subjects[])"
            :key="subject._id"
            :subject-id="subject._id"
            :subject-name="subject.name"
            :subject-image="subject.thumbnail"
            :subject-description="subject.description"
            :subject-education-level="subject.educationLevel || (subject.educationLevel as any)?.name"
            :total-views="subject.views ?? 0"
            :is-logged-in="userToken != null || userToken != undefined"
            :alt-text="subject.alt"
            @emit-subject-name="emits('emittedSubjectName', $event)"
            @emit-subject-id="emits('emittedSubjectId', $event)"
          />
        </template>
      </customGridTwo>
    </div>
    <!-- topics before login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'interactive-contents'"
    >
      <div
        v-for="(topics, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(topics) &&
            seeMoreDetails &&
            seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
          "
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ (topics?.dataOfKey as any)?.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore((topics?.dataOfKey as any)?.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            :aria-label="
              seeMoreDetails &&
              seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
                ? `See less ${(topics?.dataOfKey as any)?.toLowerCase()}`
                : `See all ${(topics?.dataOfKey as any)?.toLowerCase()}`
            "
          >
            {{
              seeMoreDetails &&
              seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(topics) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ (topics?.dataOfKey as any)?.toLowerCase() }}
          </h2>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(topics.data)"
              :key="`levels-${(topics?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((topics?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl }}</small> -->

            <!-- exrteact levels from data -->
            <CustomDropDownList
              v-if="Array.from(getLevels(topics.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(topics?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(topics.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />

            <small
              @click="setSeeMore((topics?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>

        <div v-if="hasMultipleGroups">
          <customGridTwo
            v-if="
              seeMoreDetails &&
              seeMoreDetails === (topics?.dataOfKey as any)?.toLowerCase()
            "
          >
            <template #data>
              <!-- Topic Cards  -->
              <TopicCard
                v-for="topic in topics?.data as Topic[]"
                :key="topic._id"
                :topic-id="topic._id"
                :topic-image="topic.thumbnail"
                :topic-title="topic.name"
                :topic-description="topic.descriptions"
                :subject-name="(topic.subject as any)?.name"
                :topic-views="
                  topic.viewedBy?.length
                    ? topic.viewedBy?.length
                    : topic.views
                      ? topic.views
                      : 0
                "
                :topic-standard="(topic.level as any)?.name"
                :topic-viewed="topic.isViewed"
                :topic-progress="topic.avgProgress"
                :alt-text="topic.alt"
              />
            </template>
          </customGridTwo>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <!-- Topic Cards  -->
            <TopicCard
              v-for="topic in (() => {
                const key = (topics?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (topics?.data as Topic[]).filter(
                      (t) => (t.level as any)?.name === currentLevel[key],
                    )
                  : (topics?.data as Topic[]);
              })()"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :subject-name="(topic.subject as any)?.name"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                    ? topic.views
                    : 0
              "
              :topic-standard="(topic.level as any)?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
              :alt-text="topic.alt"
            />
          </div>
        </div>

        <customGridTwo v-else>
          <template #data>
            <!-- Topic Cards  -->
            <TopicCard
              v-for="topic in (() => {
                const key = (topics?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (topics?.data as Topic[]).filter(
                      (t) => (t.level as any)?.name === currentLevel[key],
                    )
                  : (topics?.data as Topic[]);
              })()"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :subject-name="(topic.subject as any)?.name"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                    ? topic.views
                    : 0
              "
              :topic-standard="(topic.level as any)?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
              :alt-text="topic.alt"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <!-- experiment before login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'learn-activities'"
    >
      <div
        v-for="(experiments, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(experiments) &&
            seeMoreDetails &&
            seeMoreDetails === (experiments?.dataOfKey as any)?.toLowerCase()
          "
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ (experiments?.dataOfKey as any)?.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore((experiments?.dataOfKey as any)?.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            :aria-label="
              seeMoreDetails &&
              seeMoreDetails === (experiments?.dataOfKey as any)?.toLowerCase()
                ? `See less ${(experiments?.dataOfKey as any)?.toLowerCase()}`
                : `See all ${(experiments?.dataOfKey as any)?.toLowerCase()}`
            "
          >
            {{
              seeMoreDetails &&
              seeMoreDetails === (experiments?.dataOfKey as any)?.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(experiments) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ (experiments?.dataOfKey as any)?.toLowerCase() }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(experiments.data)"
              :key="`levels-${(experiments?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((experiments?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl }}</small> -->

            <!-- exrteact levels from data -->
            <CustomDropDownList
              v-if="Array.from(getLevels(experiments.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="
                currentLevel[(experiments?.dataOfKey as any)?.toLowerCase()]
              "
              placeholder="select class level"
              :list="
                Array.from(getLevels(experiments.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />

            <small
              @click="
                setSeeMore((experiments?.dataOfKey as any)?.toLowerCase())
              "
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails ===
                  (experiments?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>

        <div v-if="hasMultipleGroups">
          <customGridTwo
            v-if="
              seeMoreDetails &&
              seeMoreDetails === (experiments?.dataOfKey as any)
            "
          >
            <template #data>
              <!-- Experiment Cards  -->
              <ExperimentsCard
                v-for="experiment in experiments?.data as Experiment[]"
                :key="experiment._id"
                :experiment-id="experiment._id"
                :experiment-thumbnail="experiment.thumbnail"
                :experiment-description="experiment.description"
                :experiment-type="experiment.category"
                :experiment-subject="(experiment.subject as any)?.name"
                :experiment-level="(experiment.level as any)?.name"
                :experiment-name="experiment.name"
                :experiment-file-url="experiment.stepsFileUrl"
                :alt-text="experiment.alt"
              />
            </template>
          </customGridTwo>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <!-- Experiment Cards  -->
            <ExperimentsCard
              v-for="experiment in (() => {
                const key = (experiments?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (experiments?.data as Experiment[]).filter(
                      (e) => (e.level as any)?.name === currentLevel[key],
                    )
                  : (experiments?.data as Experiment[]);
              })()"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="(experiment.subject as any)?.name"
              :experiment-level="(experiment.level as any)?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
              :alt-text="experiment.alt"
            />
          </div>
        </div>
        <customGridTwo v-else>
          <template #data>
            <!-- Experiments Cards  -->
            <ExperimentsCard
              v-for="experiment in (() => {
                const key = (experiments?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (experiments?.data as Experiment[]).filter(
                      (e) => (e.level as any)?.name === currentLevel[key],
                    )
                  : (experiments?.data as Experiment[]);
              })()"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="(experiment.subject as any)?.name"
              :experiment-level="(experiment.level as any)?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
              :alt-text="experiment.alt"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <!-- video before login  -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'video' || activeTab === 'class-videos'"
    >
      <div
        v-for="(videos, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(videos) &&
            seeMoreDetails &&
            seeMoreDetails === (videos?.dataOfKey as any)
          "
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ videos?.dataOfKey }}
          </p>
          <small
            @click="setSeeMore(videos?.dataOfKey as any)"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            role="button"
            tabindex="0"
            :aria-label="`See less ${videos?.dataOfKey} videos`"
          >
            {{
              seeMoreDetails && seeMoreDetails === (videos?.dataOfKey as any)
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(videos) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ videos?.dataOfKey }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(videos.data)" :key="`levels-${(videos?.dataOfKey as any)?.toLowerCase()}-${i}`" 
            @click="setLevel((videos?.dataOfKey as any)?.toLowerCase(), lvl)"
            >{{ lvl }}</small> -->

            <!-- exrteact levels from data -->
            <CustomDropDownList
              v-if="Array.from(getLevels(videos.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(videos?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(videos.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />

            <small
              @click="setSeeMore((videos?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (videos?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>
        <div v-if="hasMultipleGroups">
          <customGridTwo
            v-if="
              seeMoreDetails && seeMoreDetails === (videos?.dataOfKey as any)
            "
          >
            <template #data>
              <!-- Video Cards  -->
              <VideoCard
                v-for="video in videos?.data as Videos[]"
                :key="video._id"
                :video-id="video._id"
                :is-deleted="video.isDeleted as boolean"
                :video-name="video.name"
                :video-thumbnail="video.thumbnail"
                :video-file-url="video.videoFileUrl"
                :video-description="video.description"
                :video-subject="(video.subject as any)?.name"
                :video-type="video.videoType"
                :video-level="(video.level as any)?.name"
                :video-standard="(video.level as any)?.name"
                :topic-progress="video.avgProgress as number"
                :topic-viewed="video.isViewed as boolean"
                :alt-text="video.alt"
              />
            </template>
          </customGridTwo>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <VideoCard
              v-for="video in (() => {
                const key = (videos?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (videos?.data as Videos[]).filter(
                      (v) => (v.level as any)?.name === currentLevel[key],
                    )
                  : (videos?.data as Videos[]);
              })()"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted as boolean"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="(video.subject as any)?.name"
              :video-type="video.videoType"
              :video-level="(video.level as any)?.name"
              :video-standard="(video.level as any)?.name"
              :topic-progress="video.avgProgress as number"
              :topic-viewed="video.isViewed as boolean"
              :alt-text="video.alt"
            />
          </div>
        </div>
        <customGridTwo v-else>
          <template #data>
            <!-- Video Cards  -->
            <VideoCard
              v-for="video in (() => {
                const key = (videos?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (videos?.data as Videos[]).filter(
                      (v) => (v.level as any)?.name === currentLevel[key],
                    )
                  : (videos?.data as Videos[]);
              })()"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted as boolean"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="(video.subject as any)?.name"
              :video-type="video.videoType"
              :video-level="(video.level as any)?.name"
              :video-standard="(video.level as any)?.name"
              :topic-progress="video.avgProgress as number"
              :topic-viewed="video.isViewed as boolean"
              :alt-text="video.alt"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <!-- audio before login -->
    <div
      id="main-container"
      tabindex="-1"
      v-else-if="activeTab === 'audio'"
    >
      <div
        v-for="(audios, index) in normalizedGroups"
        :key="index"
      >
        <div
          v-if="
            showGroupHeader(audios) &&
            seeMoreDetails &&
            seeMoreDetails === (audios?.dataOfKey as any)
          "
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ audios?.dataOfKey }}
          </p>
          <small
            @click="setSeeMore(audios?.dataOfKey as any)"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            role="button"
            tabindex="0"
            :aria-label="`See less ${audios?.dataOfKey} audio files`"
          >
            {{
              seeMoreDetails && seeMoreDetails === (audios?.dataOfKey as any)
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="showGroupHeader(audios) && !seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ audios?.dataOfKey }}
          </p>
          <div class="flex items-center gap-2">
            <!-- exrteact levels from data -->
            <!-- <small class="x-2 cursor-pointer" v-for="(lvl, i) in getLevels(audios.data)"
              :key="`levels-${(audios?.dataOfKey as any)?.toLowerCase()}-${i}`"
              @click="setLevel((audios?.dataOfKey as any)?.toLowerCase(), lvl)">{{ lvl }}</small> -->

            <!-- exrteact levels from data -->
            <CustomDropDownList
              v-if="Array.from(getLevels(audios.data)).length > 1"
              class="px-2 cursor-pointer"
              v-model="currentLevel[(audios?.dataOfKey as any)?.toLowerCase()]"
              placeholder="select class level"
              :list="
                Array.from(getLevels(audios.data)).map((lvl) => ({
                  id: lvl,
                  name: lvl,
                }))
              "
            />

            <small
              @click="setSeeMore((audios?.dataOfKey as any)?.toLowerCase())"
              class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue whitespace-nowrap"
            >
              {{
                seeMoreDetails &&
                seeMoreDetails === (audios?.dataOfKey as any)?.toLowerCase()
                  ? "See Less"
                  : "See All"
              }}
            </small>
          </div>
        </div>
        <div v-if="hasMultipleGroups">
          <customGridTwo
            v-if="
              seeMoreDetails && seeMoreDetails === (audios?.dataOfKey as any)
            "
          >
            <template #data>
              <!-- audio Cards  -->
              <AudioCard
                v-for="audio in audios?.data as Audios[]"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
                :alt-text="audio.alt"
              />
            </template>
          </customGridTwo>

          <div
            v-else-if="!seeMoreDetails"
            :class="[
              'flex gap-4 overflow-x-scroll scrollbar-none py-2 ',
              layoutEffect == 'list' ? 'flex-col' : 'flex-row scroll-view',
            ]"
          >
            <AudioCard
              v-for="audio in (() => {
                const key = (audios?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (audios?.data as Audios[]).filter(
                      (a) => (a.level as any)?.name === currentLevel[key],
                    )
                  : (audios?.data as Audios[]);
              })()"
              :key="audio._id"
              :audio-id="audio._id"
              :is-deleted="audio.isDeleted"
              :audio-name="audio.name"
              :audio-thumbnail="audio.thumbnail"
              :audio-file-url="audio.audioFileUrl"
              :audio-description="audio.description"
              :audio-subject="audio.subject?.name"
              :audio-type="audio.audioType"
              :alt-text="audio.alt"
            />
          </div>
        </div>
        <customGridTwo v-else>
          <template #data>
            <!-- audio Cards  -->
            <AudioCard
              v-for="audio in (() => {
                const key = (audios?.dataOfKey as any)?.toLowerCase();
                return currentLevel[key]
                  ? (audios?.data as Audios[]).filter(
                      (a) => (a.level as any)?.name === currentLevel[key],
                    )
                  : (audios?.data as Audios[]);
              })()"
              :key="audio._id"
              :audio-id="audio._id"
              :is-deleted="audio.isDeleted"
              :audio-name="audio.name"
              :audio-thumbnail="audio.thumbnail"
              :audio-file-url="audio.audioFileUrl"
              :audio-description="audio.description"
              :audio-subject="audio.subject?.name"
              :audio-type="audio.audioType"
              :alt-text="audio.alt"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <!-- fallback -->
    <div
      id="main-container"
      tabindex="-1"
      v-else
    >
      <MessageTopicNotFound message="This page will be updated soon" />
    </div>
  </div>
</template>
