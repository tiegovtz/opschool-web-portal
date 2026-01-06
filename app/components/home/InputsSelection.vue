<script setup lang="ts">
import type { ClassLevel } from '~/types/classlevel.interface'
import type { educationLevel } from '~/types/educationlevel.interface'
import type { Subjects } from '~/types/subject.interface'
import apiDocs from '~/utilities/apiDocs'

const level = ref<string>('')
const standard = ref<string>('')
const subject = ref<string>('')



const emit = defineEmits([
  "emitLevel",
  "emitSubject",
  'emitStandard'
])

const sendEmits = () => {
  emit('emitLevel', level.value)
  emit('emitStandard', standard.value)
  emit('emitSubject', subject.value)

}

// Auth headers
const token = useCookie("signInAccessToken").value;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

// Server data
const { data: educationLevels } = useFetch<educationLevel[]>(apiDocs.educationLevel.getEducationLevels, { headers });
const { data: classes } = useFetch<ClassLevel[]>(apiDocs.levels.getLevels, { headers });
const { data: subjects } = useFetch<Subjects[]>(apiDocs.subjects.getPublicSubjects, { headers });


</script>

<template>
  <div class="flex flex-col items-center justify-between gap-4 px-4 my-5 xl:flex-row">
    <form action="" class="flex flex-col items-center justify-center w-full gap-4 my-5 md:flex-row">
      <select v-model="level" name="educationLevel" id=""
        class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
        <option v-if="educationLevels" value="">Select level</option>
        <option v-else value="">loading .. </option>
        <option v-for="(level, i) in educationLevels" :value="level.name.toLowerCase()"
          :key="`education-level-option-${level._id}-${i}`">{{ level.name }}</option>
      </select>

      <!-- Secondary School Level Selection -->
      <select v-model="standard" v-if="level.trim()" name="classLevel" id="" @change="sendEmits"
        class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
        <option v-if="classes" value="">Select class</option>
        <option v-else value="">loading .. </option>
        <option v-for="(cls, i) in classes?.filter(c => c.educationLevel.name.toLowerCase() === level)" :value="cls.name"
          :key="`class-level-option-${cls._id}-${i}`">{{ cls.name
          }}</option>
      </select>
      <!-- Level Selection -->
      <select v-model="standard" v-else name="classLevel" id="" @change="sendEmits"
        class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
        <option value="">Select level first</option>
      </select>

      <!-- Subject -->
      <select name="" v-if="level.trim() && standard.trim()" v-model="subject" id="" @change="sendEmits"
        class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
        <option v-if="subjects" value="">Select subject</option>
        <option v-else value="">loading .. </option>
        <option v-for="(sbj, i) in subjects" :value="sbj.name"
          :key="`subjects-option-${sbj._id}-${i}`">{{ sbj.name
          }}</option>
      </select>

      <!-- Subject -->
      <select name="" v-else v-model="subject" id="" @change="sendEmits"
      class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <option value="">Select class first</option>
    </select>
    </form>

    <HomeSearchbar />
  </div>
</template>
