<script setup lang="ts">
import type { ClassLevel } from '~/types/classlevel.interface'
import type { educationLevel } from '~/types/educationlevel.interface'
import type { Subjects } from '~/types/subject.interface'
import apiDocs from '~/utilities/apiDocs'

const level = ref<string>('')
const standard = ref<string>('')
const subject = ref<string>('')

const EDUCATION_LEVEL_RENDER_ORDER: Record<string, number> = {
  "Pre-Primary": 0,
  Primary: 1,
  "Lower Secondary": 2,
  "Upper Secondary": 3,
  "Teacher Education": 4,
}

const sortedEducationLevels = computed(() => {
  const list = educationLevels.value || []
  return [...list].sort((a, b) => {
    const aOrder = EDUCATION_LEVEL_RENDER_ORDER[a?.name ?? ""] ?? Number.MAX_SAFE_INTEGER
    const bOrder = EDUCATION_LEVEL_RENDER_ORDER[b?.name ?? ""] ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return (a?.name ?? "").localeCompare(b?.name ?? "")
  })
})

watch(level, (newLevel, oldLevel) => {
  if (newLevel !== oldLevel) {
    standard.value = ''
    subject.value = ''
    sendEmits()
  }
})

watch(standard, (newStandard, oldStandard) => {
  if (newStandard !== oldStandard) {
    subject.value = ''
    sendEmits()
  }
})


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
        <option v-for="(lvl, i) in sortedEducationLevels" :value="lvl.name.toLowerCase()"
          :key="`education-level-option-${lvl._id}-${i}`">{{ lvl.name }}</option>
      </select>

      <!-- Secondary School Level Selection -->
      <select v-model="standard" name="classLevel" id="" @change="sendEmits" :disabled="!level.trim()"
        class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue disabled:opacity-60 disabled:cursor-not-allowed">
        <option v-if="classes" value="">Select class</option>
        <option v-else value="">loading .. </option>
        <option v-for="(cls, i) in classes?.filter(c => c.educationLevel.name.toLowerCase() === level)" :value="cls.name"
          :key="`class-level-option-${cls._id}-${i}`">{{ cls.name }}</option>
      </select>

      <!-- Subject -->
      <select name="" v-model="subject" id="" @change="sendEmits" :disabled="!(level.trim() && standard.trim())"
        class="w-full h-10 px-2 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue disabled:opacity-60 disabled:cursor-not-allowed">
        <option v-if="subjects" value="">Select subject</option>
        <option v-else value="">loading .. </option>
        <option v-for="(sbj, i) in subjects" :value="sbj.name" :key="`subjects-option-${sbj._id}-${i}`">
          {{ sbj.name }}
        </option>
      </select>
    </form>

    <HomeSearchbar />
  </div>
</template>
