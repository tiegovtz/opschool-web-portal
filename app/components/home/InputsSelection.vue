<script setup>
const level = ref('')
const standard = ref('')
const subject = ref('')



const emit = defineEmits([
  "emitLevel",
  "emitSubject",
  'emitStandard'
])

const sendEmits =()=>{
  emit('emitLevel', level.value)
  emit('emitStandard', standard.value)
  emit('emitSubject', subject.value)

}


</script>

<template>
  <div class="flex flex-col items-center justify-between gap-4 px-4 my-5 xl:flex-row">
    <form action="" class="flex flex-col items-center justify-center w-full gap-4 my-5 md:flex-row">
    <select v-model="level" name="" id=""
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue"
      @change="sendEmits">
      <option value="">Select Level</option>
      <option value="secondary">Lower Secondary</option>
      <option value="high">Upper Secondary</option>
      <option value="teacher">Teacher Education</option>
    </select>


    <!-- Primary School Class Level Selection -->
    <!-- <select v-model="standard" v-if="level === 'primary'" name="" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select Class</option>
      <option value="Standard1">Standard 1</option>
      <option value="Standard2">Standard 2</option>
      <option value="Standard3">Standard 3</option>
      <option value="Standard4">Standard 4</option>
      <option value="Standard5">Standard 5</option>
      <option value="Standard6">Standard 6</option>
    </select> -->

    <!-- Secondary School Level Selection -->
    <select v-model="standard" v-if="level === 'secondary' || level === 'all'" name="" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select Class</option>
      <option value="Form 1">Form 1</option>
      <option value="Form 2">Form 2</option>
      <option value="Form 3">Form 3</option>
      <option value="Form 4">Form 4</option>
    </select>

    <!-- High School Level Selection -->
    <select v-model="standard" v-else-if="level === 'high'" name="" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select Class</option>
      <option value="Form 5">Form 5</option>
      <option value="Form 6">Form 6</option>
    </select>

    <!-- Teacher Level Selection -->
     <select v-model="standard" v-else-if="level === 'teacher'" name="" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Teacher Education</option>
    </select>
     <!-- Level Selection -->
    <select v-model="standard" v-else name="" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select Level First</option>
    </select>

    <!-- Subject -->
    <select name="" v-if="level === 'secondary'"  v-model="subject" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select Subject</option>
      <option value="Physics">Physics</option>
      <option value="Mathematics">Mathematics</option>
      <option value="Chemistry">Chemistry</option>
      <option value="Biology">Biology</option>
      <!-- <option value="Geography">Geography</option> -->
    </select>

     <!-- Subject -->
    <select name="" v-else v-model="subject" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select Subject</option>
    </select>
  </form>

   <HomeSearchbar />
  </div>
</template>

