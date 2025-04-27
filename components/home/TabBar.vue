<script setup>

// Define Emit
const emit = defineEmits([
  'emitActiveTab'
])


// Define Props
defineProps({
  subjectTitle: String,
  topicId: String,
  isLoggedIn:{
    type: Boolean,
    default: false
  },
  activeTab: String,
})

// Define State
const tabState = reactive({
  isChecked: false,
  checkedValueButton: null,
});

// Define a Function
const tabCheck = (checkValue) => {
  tabState.isChecked = true;
  tabState.checkedValueButton = checkValue;
  emit('emitActiveTab',tabState.checkedValueButton);
}

</script>

<template>
  <section class="my-5">
    <div
      class="flex items-center justify-start gap-3 mb-6 overflow-x-scroll scrollbar-none whitespace-nowrap md:justify-center">
      
      <!-- subject tab -->
      <button v-if="isLoggedIn"
        :class="[
          'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
          {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Home' || activeTab == 'Home'}
        ]"
        @click="tabCheck('Home')" >
        <div class="flex items-center justify-center">
          <Icon name="mdi:notebook-edit" size="20" class="" />
        </div>
        Subjects
      </button>
      <!-- Interactive Learning -->
      <button v-if="isLoggedIn"
        :class="[
          'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
          {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Interactive Books' || activeTab == 'Interactive Books'}
        ]"
        @click="tabCheck('Interactive Books')" >
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        Interactive Learning
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/interactive/${subjectTitle}/${topicId}` : `/interactive/${subjectTitle}` : `/interactive`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue text-medium lg:w-45"
        active-class="text-white !bg-deepBlue ">
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        Interactive Learning
      </NuxtLink>
      

      <!-- Learning Activities -->
      <button v-if="isLoggedIn"
         :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Experiments' || activeTab == 'Experiments'}
         ]"
        @click="tabCheck('Experiments')" >
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:experiment-one" size="20" />
        </div>
        Learning Activities
      </button>
      <NuxtLink v-else  :to="subjectTitle ? topicId ? `/experiments/${subjectTitle}/${topicId}` : `/experiments/${subjectTitle}` : `/experiments`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue text-medium lg:w-45"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:experiment-one" size="20" />
        </div>
        Learning Activities
      </NuxtLink>
      

      <!-- Video -->
      <button v-if="isLoggedIn"   
        :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Video' || activeTab == 'Video'}
         ]"
        @click="tabCheck('Video')" >
        <div class="flex items-center justify-center">
          <Icon name="fluent:video-24-filled" size="20" />
        </div>
        Video
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/video/${subjectTitle}/${topicId}` : `/video/${subjectTitle}` : `/video`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue text-medium lg:w-45"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="fluent:video-24-filled" size="20" />
        </div>
        Video
      </NuxtLink>
      
      <!-- Audio -->
      <button v-if="isLoggedIn" 
      :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Audio' || activeTab == 'Audio'}
         ]"
        @click="tabCheck('Audio')" >
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
        Audio
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/audio/${subjectTitle}/${topicId}` : `/audio/${subjectTitle}` : `/audio`"
        class="flex items-center justify-center gap-2 px-2 text-center text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue text-medium lg:w-45"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
        Audio
      </NuxtLink>
    </div>
  </section>
</template>


