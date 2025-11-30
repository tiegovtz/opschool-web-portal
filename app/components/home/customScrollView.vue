<script setup>
import customGridOne from "~/components/home/customGridOne.vue";
import customGridTwo from "~/components/home/customGridTwo.vue";
import ExperimentsCard from "~/components/experiments/experimentsCard.vue";
import TopicCard from "~/components/home/TopicCard.vue";
import SubjectCard from "~/components/home/SubjectCard.vue";
import { VideoCard } from "#components";
import { layoutEffect } from "~/utilities/controlls";
import AudioCard from "../audio/audioCard.vue";

const emits = defineEmits(['emittedSubjectId','emittedActiveTab','emittedSubjectName']);

const props=defineProps({
  data: {
    type: Array,
    required: true,
  },
  activeTab: {
    type: String,
    required: true,
  },
  seeMoreDetails: String,
  shuffleSubject: Function,
});

const seeMoreDetails = ref(props.seeMoreDetails ?? null); // Initial See More
const userToken = useCookie("signInUserToken");
// modify see more
const setSeeMore = (seeMore) => {
  if (seeMoreDetails.value === seeMore) {
    seeMoreDetails.value = null;
  } else {
    seeMoreDetails.value = seeMore;
  }
};
</script>

<template>
  <div v-if="userToken">
    <div v-if="activeTab.toLowerCase() === 'home'">
      <!-- Subject Cards are in Grid -->
      <customGridOne v-if="activeTab.toLowerCase() === 'home'">
        <template #data>
          <!-- Subject Cards are in Grid -->
          <SubjectCard
            v-for="subject in shuffleSubject(data)"
            :key="subject._id"
            :subject-id="subject._id"
            :subject-name="subject.name"
            :subject-image="subject.thumbnail"
            :subject-description="subject.description"
            :total-views="subject.views ?? 0"
            :is-logged-in="userToken != null || userToken != undefined"
            @emit-subject-name="emits('emittedSubjectName',$event)"
            @emit-subject-id="emits('emittedSubjectId',$event)"
          />
        </template>
      </customGridOne>
    </div>
    <div v-else-if="activeTab.toLowerCase() === 'interactive books'">
      <div v-for="(topics, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()"
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ topics?.dataOfKey.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore(topics?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
            :aria-label="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase() ? `See less ${topics?.dataOfKey.toLowerCase()}` : `See all ${topics?.dataOfKey.toLowerCase()}`"
          >
            {{
              seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ topics?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(topics?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>

        <div v-if="data.length > 1">
          <customGridOne
            v-if="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()"
          >
            <template #data>
              <!-- Topic Cards  -->
              <TopicCard
                v-for="topic in topics?.data"
                :key="topic._id"
                :topic-id="topic._id"
                :topic-image="topic.thumbnail"
                :topic-title="topic.name"
                :topic-description="topic.descriptions"
                :subject-name="topic.subject?.name"
                :topic-duration="
                  topic.topic_duration ? topic.topic_duration : '10 min'
                "
                :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
                :topic-views="
                  topic.viewedBy?.length
                    ? topic.viewedBy?.length
                    : topic.views
                    ? topic.views
                    : 0
                "

                :topic-standard="topic.level?.name"
                :topic-viewed="topic.isViewed"
                :topic-progress="topic.avgProgress"
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
              v-for="topic in topics?.data"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :topic-duration="
                topic.topic_duration ? topic.topic_duration : '10 min'
              "
              :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                  ? topic.views
                  : 0
              "
              :topic-standard="topic.level?.name"
              :subject-name="topic.subject?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
            />
          </div>
        </div>

        <customGridOne v-else>
          <template #data>
            <!-- Topic Cards  -->
            <TopicCard
              v-for="topic in topics?.data"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :topic-duration="
                topic.topic_duration ? topic.topic_duration : '10 min'
              "
              :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                  ? topic.views
                  : 0
              "
              :topic-standard="topic.level?.name"
              :subject-name="topic.subject?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
            />
          </template>
        </customGridOne>
      </div>
    </div>
    <div v-else-if="activeTab.toLowerCase() === 'experiments'">
      <div v-for="(experiments, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ experiments?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(experiments?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ experiments?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(experiments?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>

        <div v-if="data.length > 1">
          <customGridOne
            v-if="seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()"
          >
            <template #data>
              <!-- Experiment Cards  -->
              <ExperimentsCard
                v-for="experiment in experiments?.data"
                :key="experiment._id"
                :experiment-id="experiment._id"
                :experiment-thumbnail="experiment.thumbnail"
                :experiment-title="experiment.title"
                :experiment-description="experiment.description"
                :experiment-type="experiment.category"
                :experiment-subject="experiment.subject?.name"
                :experiment-level="experiment.level?.name"
                :experiment-name="experiment.name"
                :experiment-file-url="experiment.stepsFileUrl"
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
              v-for="experiment in experiments?.data"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-title="experiment.title"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="experiment.subject?.name"
              :experiment-level="experiment.level?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
            />
          </div>
        </div>
        <customGridOne v-else>
          <template #data>
            <!-- Experiments Cards  -->
            <ExperimentsCard
              v-for="experiment in experiments?.data"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-title="experiment.title"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="experiment.subject?.name"
              :experiment-level="experiment.level?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
            />
          </template>
        </customGridOne>
      </div>
    </div>
    <div
      v-else-if="
        activeTab.toLowerCase() === 'video' ||
        activeTab.toLowerCase() === 'othervideo'
      "
    >
      <div v-for="(videos, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === videos?.dataOfKey.toLowerCase()"
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ videos?.dataOfKey.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore(videos?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
            :aria-label="seeMoreDetails && seeMoreDetails === videos?.dataOfKey.toLowerCase() ? `See less ${videos?.dataOfKey.toLowerCase()}` : `See all ${videos?.dataOfKey.toLowerCase()}`"
          >
            {{
              seeMoreDetails && seeMoreDetails === videos?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ videos?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(videos?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === videos?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div v-if="data.length > 1">
          <customGridOne
            v-if="seeMoreDetails && seeMoreDetails === videos?.dataOfKey.toLowerCase()"
          >
            <template #data>
              <!-- Video Cards  -->
              <VideoCard
                v-for="video in videos?.data"
                :key="video._id"
                :video-id="video._id"
                :is-deleted="video.isDeleted"
                :video-name="video.name"
                :video-thumbnail="video.thumbnail"
                :video-file-url="video.videoFileUrl"
                :video-description="video.description"
                :video-subject="video.subject?.name"
                :video-type="video.videoType"
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
              v-for="video in videos?.data"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="video.subject?.name"
              :video-type="video.videoType"
            />
          </div>
        </div>
        <customGridOne v-else>
          <template #data>
            <!-- Video Cards  -->
            <VideoCard
              v-for="video in videos?.data"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="video.subject?.name"
              :video-type="video.videoType"
            />
          </template>
        </customGridOne>
      </div>
    </div>
    <div v-else-if="activeTab.toLowerCase() === 'audio'">
       <div v-for="(audios, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === audios?.dataOfKey.toLowerCase()"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ audios?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(audios?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === audios?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ audios?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(audios?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === audios?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div v-if="data.length > 1">
          <customGridOne
            v-if="seeMoreDetails && seeMoreDetails === audios?.dataOfKey.toLowerCase()"
          >
            <template #data>
              <!-- audio Cards  -->
              <AudioCard
                v-for="audio in audios?.data"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
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
                v-for="audio in audios?.data"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
              />
          </div>
        </div>
        <customGridOne v-else>
          <template #data>
            <!-- Video Cards  -->
            <AudioCard
                v-for="audio in audios?.data"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
              />
          </template>
        </customGridOne>
      </div>
    </div>
    <div v-else>
      <MessageTopicNotFound message="This page will be updated soon" />
    </div>
  </div>
  <div v-else>
     <div v-if="activeTab.toLowerCase() === 'home'">
      <!-- Subject Cards are in Grid -->
      <customGridTwo v-if="activeTab.toLowerCase() === 'home'">
        <template #data>
          <!-- Subject Cards are in Grid -->
          <SubjectCard
            v-for="subject in data"
            :key="subject._id"
            :subject-id="subject._id"
            :subject-name="subject.name"
            :subject-image="subject.thumbnail"
            :subject-description="subject.description"
            :total-views="subject.views ?? 0"
            :is-logged-in="userToken != null || userToken != undefined"
            @emit-subject-name="emits('emittedSubjectName',$event)"
            @emit-subject-id="emits('emittedSubjectId',$event)"
          />
        </template>
      </customGridTwo>
    </div>
    <div v-else-if="activeTab.toLowerCase() === 'interactive books'">
      <div v-for="(topics, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()"
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ topics?.dataOfKey.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore(topics?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
            :aria-label="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase() ? `See less ${topics?.dataOfKey.toLowerCase()}` : `See all ${topics?.dataOfKey.toLowerCase()}`"
          >
            {{
              seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ topics?.dataOfKey.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore(topics?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
            :aria-label="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase() ? `See less ${topics?.dataOfKey.toLowerCase()}` : `See all ${topics?.dataOfKey.toLowerCase()}`"
          >
            {{
              seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>

        <div v-if="data.length > 1">
          <customGridTwo
            v-if="seeMoreDetails && seeMoreDetails === topics?.dataOfKey.toLowerCase()"
          >
            <template #data>
              <!-- Topic Cards  -->
              <TopicCard
                v-for="topic in topics?.data"
                :key="topic._id"
                :topic-id="topic._id"
                :topic-image="topic.thumbnail"
                :topic-title="topic.name"
                :topic-description="topic.descriptions"
                :subject-name="topic.subject?.name"
                :topic-duration="
                  topic.topic_duration ? topic.topic_duration : '10 min'
                "
                :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
                :topic-views="
                  topic.viewedBy?.length
                    ? topic.viewedBy?.length
                    : topic.views
                    ? topic.views
                    : 0
                "

                :topic-standard="topic.level?.name"
                :topic-viewed="topic.isViewed"
                :topic-progress="topic.avgProgress"
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
              v-for="topic in topics?.data"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :topic-duration="
                topic.topic_duration ? topic.topic_duration : '10 min'
              "
              :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                  ? topic.views
                  : 0
              "
              :topic-standard="topic.level?.name"
              :subject-name="topic.subject?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
            />
          </div>
        </div>

        <customGridTwo v-else>
          <template #data>
            <!-- Topic Cards  -->
            <TopicCard
              v-for="topic in topics?.data"
              :key="topic._id"
              :topic-id="topic._id"
              :topic-image="topic.thumbnail"
              :topic-title="topic.name"
              :topic-description="topic.descriptions"
              :topic-duration="
                topic.topic_duration ? topic.topic_duration : '10 min'
              "
              :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
              :topic-views="
                topic.viewedBy?.length
                  ? topic.viewedBy?.length
                  : topic.views
                  ? topic.views
                  : 0
              "
              :topic-standard="topic.level?.name"
              :subject-name="topic.subject?.name"
              :topic-viewed="topic.isViewed"
              :topic-progress="topic.avgProgress"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <div v-else-if="activeTab.toLowerCase() === 'experiments'">
      <div v-for="(experiments, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()"
          class="flex items-center justify-between py-4"
        >
          <h2 class="font-bold text-[1.3rem] capitalize">
            {{ experiments?.dataOfKey.toLowerCase() }}
          </h2>
          <small
            @click="setSeeMore(experiments?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
            :aria-label="seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase() ? `See less ${experiments?.dataOfKey.toLowerCase()}` : `See all ${experiments?.dataOfKey.toLowerCase()}`"
          >
            {{
              seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ experiments?.dataOfKey.toLowerCase() }}
          </p>
          <small
            @click="setSeeMore(experiments?.dataOfKey.toLowerCase())"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === experiments?.dataOfKey.toLowerCase()
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>

        <div v-if="data.length > 1">
          <customGridTwo
            v-if="seeMoreDetails && seeMoreDetails === experiments?.dataOfKey"
          >
            <template #data>
              <!-- Experiment Cards  -->
              <ExperimentsCard
                v-for="experiment in experiments?.data"
                :key="experiment._id"
                :experiment-id="experiment._id"
                :experiment-thumbnail="experiment.thumbnail"
                :experiment-title="experiment.title"
                :experiment-description="experiment.description"
                :experiment-type="experiment.category"
                :experiment-subject="experiment.subject?.name"
                :experiment-level="experiment.level?.name"
                :experiment-name="experiment.name"
                :experiment-file-url="experiment.stepsFileUrl"
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
              v-for="experiment in experiments?.data"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-title="experiment.title"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="experiment.subject?.name"
              :experiment-level="experiment.level?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
            />
          </div>
        </div>
        <customGridTwo v-else>
          <template #data>
            <!-- Experiments Cards  -->
            <ExperimentsCard
              v-for="experiment in experiments?.data"
              :key="experiment._id"
              :experiment-id="experiment._id"
              :experiment-thumbnail="experiment.thumbnail"
              :experiment-title="experiment.title"
              :experiment-description="experiment.description"
              :experiment-type="experiment.category"
              :experiment-subject="experiment.subject?.name"
              :experiment-level="experiment.level?.name"
              :experiment-name="experiment.name"
              :experiment-file-url="experiment.stepsFileUrl"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <div
      v-else-if="
        activeTab.toLowerCase() === 'video' ||
        activeTab.toLowerCase() === 'othervideo'
      "
    >
      <div v-for="(videos, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === videos?.dataOfKey"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ videos?.dataOfKey }}
          </p>
          <small
            @click="setSeeMore(videos?.dataOfKey)"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === videos?.dataOfKey
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ videos?.dataOfKey }}
          </p>
          <small
            @click="setSeeMore(videos?.dataOfKey)"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === videos?.dataOfKey
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div v-if="data.length > 1">
          <customGridTwo
            v-if="seeMoreDetails && seeMoreDetails === videos?.dataOfKey"
          >
            <template #data>
              <!-- Video Cards  -->
              <VideoCard
                v-for="video in videos?.data"
                :key="video._id"
                :video-id="video._id"
                :is-deleted="video.isDeleted"
                :video-name="video.name"
                :video-thumbnail="video.thumbnail"
                :video-file-url="video.videoFileUrl"
                :video-description="video.description"
                :video-subject="video.subject?.name"
                :video-type="video.videoType"
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
              v-for="video in videos?.data"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="video.subject?.name"
              :video-type="video.videoType"
            />
          </div>
        </div>
        <customGridTwo v-else>
          <template #data>
            <!-- Video Cards  -->
            <VideoCard
              v-for="video in videos?.data"
              :key="video._id"
              :video-id="video._id"
              :is-deleted="video.isDeleted"
              :video-name="video.name"
              :video-thumbnail="video.thumbnail"
              :video-file-url="video.videoFileUrl"
              :video-description="video.description"
              :video-subject="video.subject?.name"
              :video-type="video.videoType"
            />
          </template>
        </customGridTwo>
      </div>
    </div>
    <div v-else-if="activeTab.toLowerCase() === 'audio'">
      <div v-for="(audios, index) in data" :key="index">
        <div
          v-if="seeMoreDetails && seeMoreDetails === audios?.dataOfKey"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ audios?.dataOfKey }}
          </p>
          <small
            @click="setSeeMore(audios?.dataOfKey)"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === audios?.dataOfKey
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div
          v-else-if="!seeMoreDetails"
          class="flex items-center justify-between py-4"
        >
          <p class="font-bold text-[1.3rem] capitalize">
            {{ audios?.dataOfKey }}
          </p>
          <small
            @click="setSeeMore(audios?.dataOfKey)"
            class="capitalize transition-all duration-500 ease-in-out border-b-2 cursor-pointer text-oceanBlue hover:border-deepBlue hover:text-deepBlue"
          >
            {{
              seeMoreDetails && seeMoreDetails === audios?.dataOfKey
                ? "See Less"
                : "See All"
            }}
          </small>
        </div>
        <div v-if="data.length > 1">
          <customGridTwo
            v-if="seeMoreDetails && seeMoreDetails === audios?.dataOfKey"
          >
            <template #data>
              <!-- audio Cards  -->
               <AudioCard
                v-for="audio in audios?.data"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
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
                v-for="audio in audios?.data"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
              />
          </div>
        </div>
        <customGridTwo v-else>
          <template #data>
            <!-- audio Cards  -->
              <AudioCard
                v-for="audio in audios?.data"
                :key="audio._id"
                :audio-id="audio._id"
                :is-deleted="audio.isDeleted"
                :audio-name="audio.name"
                :audio-thumbnail="audio.thumbnail"
                :audio-file-url="audio.audioFileUrl"
                :audio-description="audio.description"
                :audio-subject="audio.subject?.name"
                :audio-type="audio.audioType"
              />
          </template>
        </customGridTwo>
      </div>
    </div>
    <div v-else>
      <MessageTopicNotFound message="This page will be updated soon" />
    </div>
  </div>
</template>