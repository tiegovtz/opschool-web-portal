<script setup lang="ts">
import { HomeTabs } from '~/types/enum/tabs.enum';
import type { tabs, videoType } from '~/types/types.data';


// Define Emit
const emit = defineEmits([
  'emitActiveTab'
])


// Define Props
withDefaults(defineProps<{subjectTitle?: string,
  topicId?: string,
  isLoggedIn?:boolean,
  activeTab?: tabs,
}>(),{
  isLoggedIn:false,
  activeTab:'subjects'
})

// Define State
const tabState = reactive <{
  isChecked:boolean,
  checkedValueButton:tabs | null
}>({
  isChecked: false,
  checkedValueButton: null,
});
const videoType = ref<videoType>('conceptual') //Conceptual and other initial

// Define a Function
const tabCheck = (checkValue:tabs) => {
  tabState.isChecked = true;
  tabState.checkedValueButton = checkValue;
  emit('emitActiveTab',tabState.checkedValueButton);

}

</script>

<template>
  <section class="my-5" role="navigation">
    <div
      class="flex items-center text-center justify-start gap-3 mb-6 overflow-x-scroll scrollbar-none whitespace-nowrap md:justify-center">
      
      <!-- subject tab -->
      <button v-if="isLoggedIn"
        role="tab"
        :class="[
          'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
          {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'subjects' || activeTab == 'subjects'}
        ]"
        @click="tabCheck('subjects')" >
        <div class="flex items-center justify-center">
          <Icon aria-label="" name="mdi:notebook-edit" size="20" class="" />
        </div>
        {{ HomeTabs.subject }}
      </button>
      <!-- Interactive Content -->
      <button v-if="isLoggedIn"
       role="tab"
        :class="[
          'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
          {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'interactive-contents' || activeTab == 'interactive-contents'}
        ]"
        @click="tabCheck('interactive-contents')" >
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        {{ HomeTabs.interactive }}
      </button>
      <NuxtLink :aria-label="`press to visit page for interactive contents ${subjectTitle ? `for subject ${subjectTitle}`:''}`" v-else :to="subjectTitle ? topicId ? `/interactive/${subjectTitle}/${topicId}` : `/interactive/${subjectTitle}` : `/interactive`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  text-medium lg:w-45"
        active-class="text-white !bg-deepBlue ">
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        {{ HomeTabs.interactive }}
      </NuxtLink>
      

      <!-- Learning Activities -->
      <button v-if="isLoggedIn"
       role="tab"
         :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'learn-activities' || activeTab == 'learn-activities'}
         ]"
        @click="tabCheck('learn-activities')" >
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:experiment-one" size="20" />
        </div>
        {{ HomeTabs.activity }}
      </button>
      <NuxtLink v-else :aria-label="`press to visit page of learning activities (experiments) ${subjectTitle ? `for subject ${subjectTitle}`:''}`"  :to="subjectTitle ? topicId ? `/experiments/${subjectTitle}/${topicId}` : `/experiments/${subjectTitle}` : `/experiments`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  text-medium lg:w-45"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:experiment-one" size="20" />
        </div>
        {{ HomeTabs.activity }}
      </NuxtLink>
      

      <!-- Conceptual Video -->
      <button v-if="isLoggedIn"   
       role="tab"
        :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'video' || activeTab == 'video'}
         ]"
        @click="tabCheck('video')" >
        <div class="flex items-center justify-center">
          <Icon name="fluent:video-24-filled" size="20" />
        </div>
            {{ HomeTabs.video }}
      </button>
      <NuxtLink v-else :aria-label="`press to visit page of Video ${subjectTitle ? `for subject ${subjectTitle}`:''}`" :to="{
        path:subjectTitle ? topicId ? `/video/${subjectTitle}/${topicId}` : `/video/${subjectTitle}` : `/video`,
        query:  {
          type: 'conc'
        }
      }"
        @click="videoType = 'conceptual'"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  text-medium lg:w-45"
        :active-class=" videoType == 'conceptual' ? 'text-white !bg-deepBlue': 'text-white !bg-oceanBlue'">
        <div class="flex items-center justify-center">
          <Icon name="fluent:video-24-filled" size="20" />
        </div>
        {{ HomeTabs.video }}
      </NuxtLink>

      <!-- Other Video -->
      <button v-if="isLoggedIn"   
       role="tab"
        :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'class-videos' || activeTab == 'class-videos'}
         ]"
        @click="tabCheck('class-videos')" >
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:blackboard" size="20" />
        </div>
        {{ HomeTabs.classVideos }}
      </button>
      <NuxtLink v-else 
      :aria-label="`press to visit page of class video ${subjectTitle ? `for subject ${subjectTitle}`:''}`" :to="{
        path:subjectTitle ? topicId ? `/video/${subjectTitle}/${topicId}` : `/video/${subjectTitle}` : `/video`,
        query: {
          type: 'oth'
        }
      }"
       @click="videoType = 'class-video'"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  text-medium lg:w-45"
         :active-class=" videoType == 'class-video' ? 'text-white !bg-deepBlue': 'text-white !bg-oceanBlue'
         ">
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:blackboard" size="20" />
        </div>
        {{ HomeTabs.classVideos }}
      </NuxtLink>
      
      <!-- Audio -->
      <button v-if="isLoggedIn" 
       role="tab"
      :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'audio' || activeTab == 'audio'}
         ]"
        @click="tabCheck('audio')" >
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
        {{ HomeTabs.audio }}
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/audio/${subjectTitle}/${topicId}` : `/audio/${subjectTitle}` : `/audio`"
        :aria-label="`press to visit page of audio ${subjectTitle ? `for subject ${subjectTitle}`:''}`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  text-medium lg:w-45"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
       {{ HomeTabs.audio }}
      </NuxtLink>

      <NuxtLink
          :to="'/smart-class'"
          class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-paleBrickRed focus:bg-paleBrickRed  text-medium lg:w-45"
          active-class="text-white !bg-deepBlue"
          aria-label="press to visit page of smart class page for livessession "
      >
        <div class="flex items-center justify-center">
          <Icon name="mdi:television" size="20" />
        </div>
       {{ HomeTabs.smartClass }}
      </NuxtLink>
    </div>
  </section>
</template>


