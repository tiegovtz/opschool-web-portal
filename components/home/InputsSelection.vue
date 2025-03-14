<script setup>
const level = ref('secondary')
const standard = ref('Form 1')
const subject = ref('Physics')


const emit = defineEmits([
  "emitLevel",
  "emitSubject",
])

watch(level, (newVal) => {
  if (newVal === 'primary') {
    standard.value = 'Standard 1'
  } else if (newVal === 'secondary') {
    standard.value = 'Form 1'
  } else if (newVal === 'high') {
    standard.value = 'Form 5'
  }else{
    standard.value = 'Form 1'
  }
})

const sendEmits =()=>{
  emit('emitLevel', standard.value)
  emit('emitSubject', subject.value)

}

</script>

<template>
  <form action="" class="flex md:flex-row flex-col items-center justify-center mb-10 gap-4">
    <select v-model="level" name="" id=""
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
      @change="sendEmits">
      <option value="all">Select Level</option>
      <option value="primary">Primary School</option>
      <option value="secondary">Secondary School</option>
      <option value="high">High School</option>
    </select>


    <!-- Primary School Level Selection -->
    <select v-model="standard" v-if="level === 'primary'" name="" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Standard</option>
      <option value="Standard1">Standard 1</option>
      <option value="Standard2">Standard 2</option>
      <option value="Standard3">Standard 3</option>
      <option value="Standard4">Standard 4</option>
      <option value="Standard5">Standard 5</option>
      <option value="Standard6">Standard 6</option>
    </select>

    <!-- Secondary School Level Selection -->
    <select v-model="standard" v-else-if="level === 'secondary' || level === 'all'" name="" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Standard</option>
      <option value="Form 1">Form 1</option>
      <option value="Form 2">Form 2</option>
      <option value="Form 3">Form 3</option>
      <option value="Form 4">Form 4</option>
    </select>

    <!-- High School Level Selection -->
    <select v-model="standard" v-else-if="level === 'high'" name="" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Standard</option>
      <option value="Form 5">Form 5</option>
      <option value="Form 6">Form 6</option>
    </select>

    <!-- Subject -->
    <select name="" v-model="subject" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Subject</option>
      <option value="Physics">Physics</option>
      <option value="Chemistry">Chemistry</option>
      <option value="Biology">Biology</option>
      <option value="Geography">Geography</option>
      <option value="Mathematics">Mathematics</option>
      <option value="English">English</option>
      <option value="French">French</option>
      <option value="Spanish">Spanish</option>
      <option value="German">German</option>
      <option value="Italian">Italian</option>
      <option value="Portuguese">Portuguese</option>
    </select>
  </form>
</template>

