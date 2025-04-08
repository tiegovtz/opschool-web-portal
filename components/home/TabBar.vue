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
  }
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
      class="flex items-center overflow-x-scroll scrollbar-none whitespace-nowrap justify-start md:justify-center gap-3 mb-6">
      <!-- Interactive Books -->
      <button v-if="isLoggedIn"
        :class="[
          'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
          {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Interactive Books'}
        ]"
        @click="tabCheck('Interactive Books')" >
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        Interactive Books
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/interactive/${subjectTitle}/${topicId}` : `/interactive/${subjectTitle}` : `/interactive`"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue ">
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        Interactive Books
      </NuxtLink>
      

      <!-- Experiments -->
      <button v-if="isLoggedIn"
         :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Experiments'}
         ]"
        @click="tabCheck('Experiments')" >
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:experiment-one" size="20" />
        </div>
        Experiments
      </button>
      <NuxtLink v-else  :to="subjectTitle ? topicId ? `/experiments/${subjectTitle}/${topicId}` : `/experiments/${subjectTitle}` : `/experiments`"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="icon-park-solid:experiment-one" size="20" />
        </div>
        Experiments
      </NuxtLink>
      

      <!-- Video -->
      <button v-if="isLoggedIn"   
        :class="[
        'flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2',
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Video'}
         ]"
        @click="tabCheck('Video')" >
        <div class="flex items-center justify-center">
          <Icon name="fluent:video-24-filled" size="20" />
        </div>
        Video
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/video/${subjectTitle}/${topicId}` : `/video/${subjectTitle}` : `/video`"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
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
         {'text-white !bg-deepBlue' : tabState.isChecked && tabState.checkedValueButton == 'Audio'}
         ]"
        @click="tabCheck('Audio')" >
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
        Audio
      </button>
      <NuxtLink v-else :to="subjectTitle ? topicId ? `/audio/${subjectTitle}/${topicId}` : `/audio/${subjectTitle}` : `/audio`"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
        Audio
      </NuxtLink>
    </div>
  </section>
</template>


