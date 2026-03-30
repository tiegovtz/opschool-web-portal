<script setup lang="ts">
import { homeTabsByLanguage } from "~/types/enum/tabs.enum";
import type { LanguageSupport } from "~/types/language.interface";
import type { tabs, videoType, tabGroup } from "~/types/types.data";
import { moveFocus } from "~/utilities/focus.helper";
import {
  getEducationRouteQuery,
  normalizeEducationLevel,
} from "~/utilities/educationRoute";

// Define Emit
const emit = defineEmits(["emitActiveTab"]);

// Define Props
const props = withDefaults(
  defineProps<{
    educationLevel?: string;
    language?: LanguageSupport;
    subjectTitle?: string;
    tabGroup?: tabGroup;
    topicId?: string;
    isLoggedIn?: boolean;
    activeTab?: tabs;
  }>(),
  {
    language: "english",
    isLoggedIn: false,
    activeTab: "subjects",
    tabGroup: "secondary",
  },
);

// Define State
const videoType = ref<videoType>("conceptual"); //Conceptual and other initial

const tabState = reactive<{
  isChecked: boolean;
  checkedValueButton: tabs | null;
}>({
  isChecked: false,
  checkedValueButton: null,
});

// Define a Function
const tabCheck = (checkValue: tabs) => {
  if (!checkValue) return;
  tabState.isChecked = true;
  tabState.checkedValueButton = checkValue;
  emit("emitActiveTab", tabState.checkedValueButton);
};

const localizedContent = computed(() =>
  props.language === "kiswahili"
    ? {
        tabs: homeTabsByLanguage.kiswahili,
        skipContent: "Ruka maudhui",
        subjectIcon: "Masomo",
        skipToSubjectList: "Bonyeza enter kwenda kwenye orodha ya masomo",
        skipToInteractiveList:
          "Bonyeza enter kwenda kwenye orodha ya maudhui shirikishi",
        visitInteractivePage: "Bonyeza kutembelea ukurasa wa maudhui shirikishi",
        visitSubjectSuffix: "kwa somo la",
        visitActivitiesPage:
          "Bonyeza kutembelea ukurasa wa shughuli za kujifunza",
        skipToActivitiesList:
          "Bonyeza enter kwenda kwenye orodha ya shughuli za mwanafunzi",
        visitVideoPage: "Bonyeza kutembelea ukurasa wa video",
        skipToVideosList: "Bonyeza enter kwenda kwenye orodha ya video",
        visitClassVideoPage:
          "Bonyeza kutembelea ukurasa wa video za darasani",
        skipToClassVideosList:
          "Bonyeza enter kwenda kwenye orodha ya video za darasani",
        visitAudioPage: "Bonyeza kutembelea ukurasa wa sauti",
        skipToAudiosList: "Bonyeza enter kwenda kwenye orodha ya sauti",
      }
    : {
        tabs: homeTabsByLanguage.english,
        skipContent: "Skip content",
        subjectIcon: "Subjects",
        skipToSubjectList: "Press enter to jump to subject list",
        skipToInteractiveList:
          "Press enter to jump to interactive contents list",
        visitInteractivePage: "press to visit page for interactive contents",
        visitSubjectSuffix: "for subject",
        visitActivitiesPage:
          "press to visit page of learning activities (experiments)",
        skipToActivitiesList: "Press enter to jump to learner activities list",
        visitVideoPage: "press to visit page of Video",
        skipToVideosList: "Press enter to jump videos list",
        visitClassVideoPage: "press to visit page of class video",
        skipToClassVideosList: "Press enter to jump to class videos list",
        visitAudioPage: "press to visit page of audio",
        skipToAudiosList: "Press enter to jump to audios list",
      },
);

const anonymousEducationLevel = computed(() =>
  normalizeEducationLevel(props.educationLevel ?? props.tabGroup),
);

const buildAnonymousTarget = (
  path: string,
  extraQuery: Record<string, any> = {},
) => ({
  path,
  query: {
    ...getEducationRouteQuery(anonymousEducationLevel.value),
    ...extraQuery,
  },
});
</script>

<template>
  <section class="my-5">
    <div
      class="flex items-center text-center justify-start gap-3 mb-6 overflow-x-scroll scrollbar-none whitespace-nowrap md:justify-center"
    >
      <!-- subject tab -->
      <div
        v-if="isLoggedIn"
        class=""
      >
        <button
          role="tab"
          :class="[
            'flex items-center justify-center cursor-pointer rounded-[6px] bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
            {
              'text-white !bg-deepBlue':
                (tabState.isChecked &&
                  tabState.checkedValueButton == 'subjects') ||
                activeTab == 'subjects',
            },
          ]"
          @click="tabCheck('subjects')"
        >
          <div class="flex items-center justify-center">
            <IconsSubjects
              :size="20"
              :aria-label="localizedContent.subjectIcon"
            />
          </div>
          {{ localizedContent.tabs.subject }}
        </button>
        <button
          v-if="activeTab === 'subjects'"
          type="button"
          class="sr-only"
          @click="moveFocus('main-container')"
          :aria-label="localizedContent.skipToSubjectList"
        >
          {{ localizedContent.skipContent }}
        </button>
      </div>

      <!-- Interactive Content -->
      <div
        v-if="isLoggedIn"
        class=""
      >
        <button
          role="tab"
          :class="[
            'flex items-center justify-center cursor-pointer rounded-[6px] bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
            {
              'text-white !bg-deepBlue':
                (tabState.isChecked &&
                  tabState.checkedValueButton == 'interactive-contents') ||
                activeTab == 'interactive-contents',
            },
          ]"
          @click="tabCheck('interactive-contents')"
        >
          <div class="flex items-center justify-center">
            <IconsInteractive
              :size="20"
              class=""
            />
          </div>
          {{ localizedContent.tabs.interactive }}
        </button>
        <button
          v-if="activeTab === 'interactive-contents'"
          class="sr-only"
          @click="moveFocus('main-container')"
          :aria-label="localizedContent.skipToInteractiveList"
        >
          {{ localizedContent.skipContent }}
        </button>
      </div>

      <NuxtLink
        :aria-label="`${localizedContent.visitInteractivePage}${subjectTitle ? ` ${localizedContent.visitSubjectSuffix} ${subjectTitle}` : ''}`"
        v-else
        :to="buildAnonymousTarget(
          subjectTitle
            ? topicId
              ? `/interactive/${subjectTitle}/${topicId}`
              : `/interactive/${subjectTitle}`
            : `/interactive`,
        )"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-[6px] cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
        active-class="text-white !bg-deepBlue "
      >
        <div class="flex items-center justify-center">
          <IconsInteractive
            :size="20"
            class=""
          />
        </div>
        {{ localizedContent.tabs.interactive }}
      </NuxtLink>

      <!-- Learning Activities -->
      <div v-if="tabGroup === 'secondary'" class="flex items-center text-center justify-start gap-3 overflow-x-scroll scrollbar-none whitespace-nowrap md:justify-center"  >
        <div v-if="isLoggedIn">
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-[6px] bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
              {
                'text-white !bg-deepBlue':
                  (tabState.isChecked &&
                    tabState.checkedValueButton == 'learn-activities') ||
                  activeTab == 'learn-activities',
              },
            ]"
            @click="tabCheck('learn-activities')"
          >
            <div class="flex items-center justify-center">
              <IconsActivity :size="20" />
            </div>
            {{ localizedContent.tabs.activity }}
          </button>
          <button
            v-if="activeTab === 'learn-activities'"
            class="sr-only"
            @click="moveFocus('main-container')"
            :aria-label="localizedContent.skipToActivitiesList"
          >
            {{ localizedContent.skipContent }}
          </button>
        </div>
        <NuxtLink
          v-else
          :aria-label="`${localizedContent.visitActivitiesPage}${subjectTitle ? ` ${localizedContent.visitSubjectSuffix} ${subjectTitle}` : ''}`"
          :to="buildAnonymousTarget(
            subjectTitle
              ? topicId
                ? `/experiments/${subjectTitle}/${topicId}`
                : `/experiments/${subjectTitle}`
              : `/experiments`,
          )"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-[6px] cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          active-class="text-white !bg-deepBlue"
        >
          <div class="flex items-center justify-center">
            <IconsActivity :size="20" />
          </div>
          {{ localizedContent.tabs.activity }}
        </NuxtLink>

        <!-- Conceptual Video -->
        <div
          v-if="isLoggedIn"
          class=""
        >
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-[6px] bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
              {
                'text-white !bg-deepBlue':
                  (tabState.isChecked &&
                    tabState.checkedValueButton == 'video') ||
                  activeTab == 'video',
              },
            ]"
            @click="tabCheck('video')"
          >
            <div class="flex items-center justify-center">
              <IconsConceptualVideo :size="20" />
            </div>
            {{ localizedContent.tabs.video }}
          </button>
          <button
            v-if="activeTab === 'video'"
            class="sr-only"
            @click="moveFocus('main-container')"
            :aria-label="localizedContent.skipToVideosList"
          >
            {{ localizedContent.skipContent }}
          </button>
        </div>
        <NuxtLink
          v-else
          :aria-label="`${localizedContent.visitVideoPage}${subjectTitle ? ` ${localizedContent.visitSubjectSuffix} ${subjectTitle}` : ''}`"
          :to="buildAnonymousTarget(
            subjectTitle
              ? topicId
                ? `/video/${subjectTitle}/${topicId}`
                : `/video/${subjectTitle}`
              : `/video`,
            { type: 'conc' },
          )"
          @click="videoType = 'conceptual'"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-[6px] cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          :active-class="
            videoType == 'conceptual'
              ? 'text-white !bg-deepBlue'
              : 'text-white !bg-oceanBlue'
          "
        >
          <div class="flex items-center justify-center">
            <IconsConceptualVideo :size="20" />
          </div>
          {{ localizedContent.tabs.video }}
        </NuxtLink>

        <!-- Other Video -->
        <div
          v-if="isLoggedIn"
          class=""
        >
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-[6px] bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
              {
                'text-white !bg-deepBlue':
                  (tabState.isChecked &&
                    tabState.checkedValueButton == 'class-videos') ||
                  activeTab == 'class-videos',
              },
            ]"
            @click="tabCheck('class-videos')"
          >
            <div class="flex items-center justify-center">
              <IconsOtherVideo :size="20" />
            </div>
            {{ localizedContent.tabs.classVideos }}
          </button>
          <button
            v-if="activeTab === 'class-videos'"
            class="sr-only"
            @click="moveFocus('main-container')"
            :aria-label="localizedContent.skipToClassVideosList"
          >
            {{ localizedContent.skipContent }}
          </button>
        </div>
        <NuxtLink
          v-else
          :aria-label="`${localizedContent.visitClassVideoPage}${subjectTitle ? ` ${localizedContent.visitSubjectSuffix} ${subjectTitle}` : ''}`"
          :to="buildAnonymousTarget(
            subjectTitle
              ? topicId
                ? `/video/${subjectTitle}/${topicId}`
                : `/video/${subjectTitle}`
              : `/video`,
            { type: 'oth' },
          )"
          @click="videoType = 'class-video'"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-[6px] cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          :active-class="
            videoType == 'class-video'
              ? 'text-white !bg-deepBlue'
              : 'text-white !bg-oceanBlue'
          "
        >
          <div class="flex items-center justify-center">
            <IconsOtherVideo :size="20" />
          </div>
          {{ localizedContent.tabs.classVideos }}
        </NuxtLink>

        <!-- Audio -->
        <div v-if="isLoggedIn">
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-[6px] bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
              {
                'text-white !bg-deepBlue':
                  (tabState.isChecked &&
                    tabState.checkedValueButton == 'audio') ||
                  activeTab == 'audio',
              },
            ]"
            @click="tabCheck('audio')"
          >
            <div class="flex items-center justify-center">
              <IconsAudio :size="20" />
            </div>
            {{ localizedContent.tabs.audio }}
          </button>
          <button
            v-if="activeTab === 'audio'"
            class="sr-only"
            @click="moveFocus('main-container')"
            :aria-label="localizedContent.skipToAudiosList"
          >
            {{ localizedContent.skipContent }}
          </button>
        </div>
        <NuxtLink
          v-else
          :to="buildAnonymousTarget(
            subjectTitle
              ? topicId
                ? `/audio/${subjectTitle}/${topicId}`
                : `/audio/${subjectTitle}`
              : `/audio`,
          )"
          :aria-label="`${localizedContent.visitAudioPage}${subjectTitle ? ` ${localizedContent.visitSubjectSuffix} ${subjectTitle}` : ''}`"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-[6px] cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          active-class="text-white !bg-deepBlue"
        >
          <div class="flex items-center justify-center">
            <IconsAudio :size="20" />
          </div>
          {{ localizedContent.tabs.audio }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
