<script setup lang="ts">
import type { ClassLevel } from '~/types/classlevel.interface'
import type { educationLevel } from '~/types/educationlevel.interface'
import type { LanguageSupport } from '~/types/language.interface'
import type { Subjects } from '~/types/subject.interface'
import apiDocs from '~/utilities/apiDocs'

const props = withDefaults(
  defineProps<{ educationLevel?: string; language?: LanguageSupport }>(),
  {
    language: 'english',
  }
)

const level = ref<string>('')
const standard = ref<string>('')
const subject = ref<string>('')

const emit = defineEmits([
  "emitLevel",
  "emitSubject",
  'emitStandard'
])

const normalizeValue = (value?: string | null) => value?.trim().toLowerCase() ?? ''

const getEducationBucket = (value?: string | null) => {
  const normalizedValue = normalizeValue(value)

  if (['primary', 'primary education', 'elimu ya msingi', 'msingi'].includes(normalizedValue)) {
    return 'primary'
  }

  if (['secondary', 'secondary education', 'elimu ya sekondari', 'sekondari'].includes(normalizedValue)) {
    return 'secondary'
  }

  return normalizedValue || null
}

const matchesEducationLevel = (candidate?: string | null, selected?: string | null) =>
  !!candidate &&
  !!selected &&
  (normalizeValue(candidate) === normalizeValue(selected) ||
    getEducationBucket(candidate) === getEducationBucket(selected))

const content = computed(() =>
  props.language === 'kiswahili'
    ? {
        selectLevel: 'Chagua ngazi ya elimu',
        selectClass: 'Chagua darasa',
        selectLevelFirst: 'Chagua ngazi kwanza',
        selectSubject: 'Chagua somo',
        selectClassFirst: 'Chagua darasa kwanza',
        loading: 'Inapakia...',
      }
    : {
        selectLevel: 'Select education level',
        selectClass: 'Select class',
        selectLevelFirst: 'Select level first',
        selectSubject: 'Select subject',
        selectClassFirst: 'Select class first',
        loading: 'Loading...',
      }
)

const getEducationLevelLabel = (educationLevelName: string) => {
  const bucket = getEducationBucket(educationLevelName)

  if (bucket === 'primary') {
    return props.language === 'kiswahili' ? 'Elimu ya Msingi' : 'Primary Education'
  }

  if (bucket === 'secondary') {
    return props.language === 'kiswahili' ? 'Elimu ya Sekondari' : 'Secondary Education'
  }

  return educationLevelName
}

const dropdownButtonClass =
  'h-10 w-full rounded-none border-b border-gray-300 px-2 py-2 text-left text-sm text-gray-700 shadow-none focus:border-oceanBlue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500'

const sendEmits = () => {
  emit('emitLevel', level.value)
  emit('emitStandard', standard.value)
  emit('emitSubject', subject.value)

}

const onLevelChange = (nextLevel: string | number | null) => {
  const resolvedLevel = String(nextLevel ?? '')

  if (level.value === resolvedLevel) return

  level.value = resolvedLevel
  standard.value = ''
  subject.value = ''
  sendEmits()
}

const onStandardChange = (nextStandard: string | number | null) => {
  const resolvedStandard = String(nextStandard ?? '')

  if (standard.value === resolvedStandard) return

  standard.value = resolvedStandard
  subject.value = ''
  sendEmits()
}

const onSubjectChange = (nextSubject: string | number | null) => {
  const resolvedSubject = String(nextSubject ?? '')

  if (subject.value === resolvedSubject) return

  subject.value = resolvedSubject
  sendEmits()
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

const matchedEducationLevels = computed(() => {
  if (!props.educationLevel || !educationLevels.value?.length) return []

  return educationLevels.value.filter((educationLevelOption) =>
    matchesEducationLevel(educationLevelOption.name, props.educationLevel)
  )
})

const filteredEducationLevels = computed(() =>
  matchedEducationLevels.value.length ? matchedEducationLevels.value : educationLevels.value ?? []
)

const isEducationLevelLocked = computed(() => matchedEducationLevels.value.length === 1)

const educationLevelOptions = computed(() =>
  filteredEducationLevels.value.map((educationLevelOption) => ({
    id: normalizeValue(educationLevelOption.name),
    name: getEducationLevelLabel(educationLevelOption.name),
  }))
)

const classOptions = computed(() => {
  if (!level.value.trim()) return []

  return (classes.value ?? [])
    .filter((cls) => normalizeValue(cls.educationLevel.name) === level.value)
    .map((cls) => ({
      id: cls.name,
      name: cls.name,
    }))
})

const subjectOptions = computed(() => {
  if (!level.value.trim() || !standard.value.trim()) return []

  return (subjects.value ?? []).map((sbj) => ({
    id: sbj.name,
    name: sbj.name,
  }))
})

watch(
  matchedEducationLevels,
  (matchedLevels) => {
    if (!matchedLevels.length) return

    const nextLevel = normalizeValue(matchedLevels[0]?.name)
    if (!nextLevel || level.value === nextLevel) return

    onLevelChange(nextLevel)
  },
  { immediate: true }
)

</script>

<template>
  <div class="flex flex-col items-center justify-between gap-4 px-4 my-5 xl:flex-row">
    <form action="" class="flex flex-col items-center justify-center w-full gap-4 my-5 md:flex-row">
      <CustomDropDownList
        id="home-education-level"
        :model-value="level"
        :list="educationLevelOptions"
        :placeholder="educationLevels ? content.selectLevel : content.loading"
        :disabled="isEducationLevelLocked"
        :button-class="dropdownButtonClass"
        @update-model-value="onLevelChange"
      />

      <CustomDropDownList
        id="home-class-level"
        :model-value="standard"
        :list="classOptions"
        :placeholder="level.trim() ? (classes ? content.selectClass : content.loading) : content.selectLevelFirst"
        :disabled="!level.trim() || !classOptions.length"
        :button-class="dropdownButtonClass"
        @update-model-value="onStandardChange"
      />

      <CustomDropDownList
        id="home-subject"
        :model-value="subject"
        :list="subjectOptions"
        :placeholder="level.trim() && standard.trim() ? (subjects ? content.selectSubject : content.loading) : content.selectClassFirst"
        :disabled="!level.trim() || !standard.trim() || !subjectOptions.length"
        :button-class="dropdownButtonClass"
        @update-model-value="onSubjectChange"
      />
    </form>

    <HomeSearchbar :language="props.language" :education-level="props.educationLevel" />
  </div>
</template>
