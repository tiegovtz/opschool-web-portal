<script setup lang="ts">
import { HomeTabs } from "~/types/enum/tabs.enum";
import type { LanguageSupport } from "~/types/language.interface";
import type { tabs, videoType, tabGroup } from "~/types/types.data";
import { moveFocus } from "~/utilities/focus.helper";

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
            'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
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
              aria-label="Subjects"
            />
          </div>
          {{ HomeTabs.subject }}
        </button>
        <button
          v-if="activeTab === 'subjects'"
          type="button"
          class="sr-only"
          @click="moveFocus('main-container')"
          aria-label="Press enter to jump to subject list"
        >
          Skip content
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
            'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
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
          {{ HomeTabs.interactive }}
        </button>
        <button
          v-if="activeTab === 'interactive-contents'"
          class="sr-only"
          @click="moveFocus('main-container')"
          aria-label="Press enter to jump to interactive contents list"
        >
          Skip content
        </button>
      </div>

      <NuxtLink
        :aria-label="`press to visit page for interactive contents ${subjectTitle ? `for subject ${subjectTitle}` : ''}`"
        v-else
        :to="
          subjectTitle
            ? topicId
              ? `/interactive/${subjectTitle}/${topicId}`
              : `/interactive/${subjectTitle}`
            : `/interactive`
        "
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
        active-class="text-white !bg-deepBlue "
      >
        <div class="flex items-center justify-center">
          <IconsInteractive
            :size="20"
            class=""
          />
        </div>
        {{ HomeTabs.interactive }}
      </NuxtLink>

      <!-- Learning Activities -->
      <div v-if="tabGroup === 'secondary'" class="flex items-center text-center justify-start gap-3 overflow-x-scroll scrollbar-none whitespace-nowrap md:justify-center"  >
        <div v-if="isLoggedIn">
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
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
            {{ HomeTabs.activity }}
          </button>
          <button
            v-if="activeTab === 'learn-activities'"
            class="sr-only"
            @click="moveFocus('main-container')"
            aria-label="Press enter to jump to learner activities list"
          >
            Skip content
          </button>
        </div>
        <NuxtLink
          v-else
          :aria-label="`press to visit page of learning activities (experiments) ${subjectTitle ? `for subject ${subjectTitle}` : ''}`"
          :to="
            subjectTitle
              ? topicId
                ? `/experiments/${subjectTitle}/${topicId}`
                : `/experiments/${subjectTitle}`
              : `/experiments`
          "
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          active-class="text-white !bg-deepBlue"
        >
          <div class="flex items-center justify-center">
            <IconsActivity :size="20" />
          </div>
          {{ HomeTabs.activity }}
        </NuxtLink>

        <!-- Conceptual Video -->
        <div
          v-if="isLoggedIn"
          class=""
        >
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
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
            {{ HomeTabs.video }}
          </button>
          <button
            v-if="activeTab === 'video'"
            class="sr-only"
            @click="moveFocus('main-container')"
            aria-label="Press enter to jump videos list"
          >
            Skip content
          </button>
        </div>
        <NuxtLink
          v-else
          :aria-label="`press to visit page of Video ${subjectTitle ? `for subject ${subjectTitle}` : ''}`"
          :to="{
            path: subjectTitle
              ? topicId
                ? `/video/${subjectTitle}/${topicId}`
                : `/video/${subjectTitle}`
              : `/video`,
            query: {
              type: 'conc',
            },
          }"
          @click="videoType = 'conceptual'"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          :active-class="
            videoType == 'conceptual'
              ? 'text-white !bg-deepBlue'
              : 'text-white !bg-oceanBlue'
          "
        >
          <div class="flex items-center justify-center">
            <IconsConceptualVideo :size="20" />
          </div>
          {{ HomeTabs.video }}
        </NuxtLink>

        <!-- Other Video -->
        <div
          v-if="isLoggedIn"
          class=""
        >
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
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
            {{ HomeTabs.classVideos }}
          </button>
          <button
            v-if="activeTab === 'class-videos'"
            class="sr-only"
            @click="moveFocus('main-container')"
            aria-label="Press enter to jump to class videos list"
          >
            Skip content
          </button>
        </div>
        <NuxtLink
          v-else
          :aria-label="`press to visit page of class video ${subjectTitle ? `for subject ${subjectTitle}` : ''}`"
          :to="{
            path: subjectTitle
              ? topicId
                ? `/video/${subjectTitle}/${topicId}`
                : `/video/${subjectTitle}`
              : `/video`,
            query: {
              type: 'oth',
            },
          }"
          @click="videoType = 'class-video'"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          :active-class="
            videoType == 'class-video'
              ? 'text-white !bg-deepBlue'
              : 'text-white !bg-oceanBlue'
          "
        >
          <div class="flex items-center justify-center">
            <IconsOtherVideo :size="20" />
          </div>
          {{ HomeTabs.classVideos }}
        </NuxtLink>

        <!-- Audio -->
        <div v-if="isLoggedIn">
          <button
            role="tab"
            :class="[
              'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
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
            {{ HomeTabs.audio }}
          </button>
          <button
            v-if="activeTab === 'audio'"
            class="sr-only"
            @click="moveFocus('main-container')"
            aria-label="Press enter to jump to audios list"
          >
            Skip content
          </button>
        </div>
        <NuxtLink
          v-else
          :to="
            subjectTitle
              ? topicId
                ? `/audio/${subjectTitle}/${topicId}`
                : `/audio/${subjectTitle}`
              : `/audio`
          "
          :aria-label="`press to visit page of audio ${subjectTitle ? `for subject ${subjectTitle}` : ''}`"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed text-medium lg:w-45"
          active-class="text-white !bg-deepBlue"
        >
          <div class="flex items-center justify-center">
            <IconsAudio :size="20" />
          </div>
          {{ HomeTabs.audio }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
