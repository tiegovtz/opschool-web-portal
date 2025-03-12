<script setup>
const level = ref('secondary')
const standard = ref('form1')
const subject = ref('physics')


const emit = defineEmits([
  "emitLevel",
  "emitStandard",
  "emitSubject",
])

watch(level, (newVal) => {
  if (newVal === 'primary') {
    standard.value = 'standard1'
  } else if (newVal === 'secondary') {
    standard.value = 'form1'
  } else if (newVal === 'high') {
    standard.value = 'form5'
  }else{
    standard.value = 'form1'
  }
})

const sendEmits =()=>{
  emit('emitLevel', level.value)
  emit('emitStandard', standard.value)
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
      <option value="standard1">Standard 1</option>
      <option value="standard2">Standard 2</option>
      <option value="standard3">Standard 3</option>
      <option value="standard4">Standard 4</option>
      <option value="standard5">Standard 5</option>
      <option value="standard6">Standard 6</option>
    </select>

    <!-- Secondary School Level Selection -->
    <select v-model="standard" v-else-if="level === 'secondary' || level === 'all'" name="" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Standard</option>
      <option value="form1">Form 1</option>
      <option value="form2">Form 2</option>
      <option value="form3">Form 3</option>
      <option value="form4">Form 4</option>
    </select>

    <!-- High School Level Selection -->
    <select v-model="standard" v-else-if="level === 'high'" name="" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Standard</option>
      <option value="form5">Form 5</option>
      <option value="form6">Form 6</option>
    </select>

    <!-- Subject -->
    <select name="" v-model="subject" id="" @change="sendEmits"
      class="w-full h-10 border-b border-gray-300 px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="all">Select Subject</option>
      <option value="mathematics">Mathematics</option>
      <option value="english">English</option>
      <option value="physics">Physics</option>
      <option value="chemistry">Chemistry</option>
      <option value="biology">Biology</option>
      <option value="french">French</option>
      <option value="spanish">Spanish</option>
      <option value="german">German</option>
      <option value="italian">Italian</option>
      <option value="portuguese">Portuguese</option>
    </select>
  </form>
</template>

