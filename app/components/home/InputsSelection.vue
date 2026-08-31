<script setup lang="ts">
import type { ClassLevel } from "~/types/classlevel.interface";
import type { educationLevel } from "~/types/educationlevel.interface";
import type { LanguageSupport } from "~/types/language.interface";
import type { Subjects } from "~/types/subject.interface";
import apiDocs from "~/utilities/apiDocs";
import { adtClassOptions, adtSubjectOptions, type AdtClassifications } from '~~/shared/adt/catalogue';
import {
  getApiEducationLevelName,
  isEducationLevelVisibleInHub,
  normalizeEducationLevel,
} from "~/utilities/educationRoute";

type DropdownOption = {
  id: string;
  name: string;
};

const props = withDefaults(
  defineProps<{ educationLevel?: string; language?: LanguageSupport; classifications?: AdtClassifications; disabled?: boolean }>(),
  {
    language: "english",
  },
);

const emit = defineEmits<{
  (event: "emitLevel", value: string): void;
  (event: "emitStandard", value: string): void;
  (event: "emitSubject", value: string): void;
  (event: "emitSearch", value: string): void;
}>();

const normalizeValue = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const getEducationBucket = (value?: string | null) =>
  value?.trim() ? normalizeEducationLevel(value) : null;
const level = ref<string>("");
const standard = ref<string>("");
const subject = ref<string>("");


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
    return (a?.name ?? "").localeCompare(b?.name ?? "", undefined, { numeric: true, sensitivity: "base" })
  })
})

/** Ascending order for class / subject labels (Form 1 … Form 10, A–Z). */
function sortOptionsByNameAsc(options: DropdownOption[]): DropdownOption[] {
  return [...options].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  )
}

const matchesEducationLevel = (
  candidate?: string | null,
  selected?: string | null,
) =>
  !!candidate &&
  !!selected &&
  (normalizeValue(candidate) === normalizeValue(selected) ||
    getEducationBucket(candidate) === getEducationBucket(selected));

const content = computed(() =>
  props.language === "kiswahili"
    ? {
        selectLevel: "Chagua ngazi ya elimu",
        selectClass: "Chagua darasa",
        selectLevelFirst: "Chagua ngazi",
        selectSubject: "Chagua somo",
        selectClassFirst: "Chagua somo",
        loading: "Inapakia...",
      }
    : {
        selectLevel: "Select education level",
        selectClass: "Select class",
        selectLevelFirst: "Select class",
        selectSubject: "Select subject",
        selectClassFirst: "Select subject",
        loading: "Loading...",
      },
);

const dropdownButtonClass =
  "h-10 w-full rounded-none border-b border-gray-300 px-2 py-2 text-left text-sm text-gray-700 shadow-none focus:border-oceanBlue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const emitSelection = () => {
  emit("emitLevel", level.value);
  emit("emitStandard", standard.value);
  emit("emitSubject", subject.value);
};

const clearSelectedSubject = () => {
  subject.value = "";
};

const clearDependentSelections = () => {
  standard.value = "";
  clearSelectedSubject();
};

const onLevelChange = (nextLevel: string | number | null) => {
  const resolvedLevel = String(nextLevel ?? "");

  if (level.value === resolvedLevel) return;

  level.value = resolvedLevel;
  clearDependentSelections();
  emitSelection();
};

const onStandardChange = (nextStandard: string | number | null) => {
  const resolvedStandard = String(nextStandard ?? "");

  if (standard.value === resolvedStandard) return;

  standard.value = resolvedStandard;
  clearSelectedSubject();
  emitSelection();
};

const onSubjectChange = (nextSubject: string | number | null) => {
  const resolvedSubject = String(nextSubject ?? "");

  if (subject.value === resolvedSubject) return;

  subject.value = resolvedSubject;
  emitSelection();
};

const token = useCookie("signInAccessToken").value;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

const { data: educationLevels, pending: educationLevelsPending } = useFetch<
  educationLevel[]
>(apiDocs.educationLevel.getEducationLevels, {
  immediate: !props.classifications,
  headers,
  default: () => [],
});

const selectedEducationBucket = computed(() => getEducationBucket(level.value));

const { data: classLevels, pending: classLevelsPending } = useFetch<
  ClassLevel[]
>(apiDocs.levels.getLevels, {
  immediate: !props.classifications,
  headers,
  query: computed(() =>
    selectedEducationBucket.value
      ? { educationLevel: getApiEducationLevelName(selectedEducationBucket.value) }
      : {},
  ),
  default: () => [],
  watch: props.classifications ? false : [selectedEducationBucket],
});

const { data: publicSubjects, pending: publicSubjectsPending } = useFetch<
  Subjects[]
>(apiDocs.subjects.getPublicSubjects, {
  immediate: !props.classifications,
  headers,
  query: computed(() => {
    if (!selectedEducationBucket.value) return {};

    return {
      educationLevel: getApiEducationLevelName(selectedEducationBucket.value),
      ...(standard.value ? { level: standard.value } : {}),
    };
  }),
  default: () => [],
  watch: props.classifications ? false : [level,standard],
});

const matchedEducationLevels = computed(() => {
  if (!props.educationLevel || !educationLevels.value.length) return [];

  return educationLevels.value.filter((educationLevelOption) =>
    isEducationLevelVisibleInHub(
      educationLevelOption.name,
      props.educationLevel,
    ),
  );
});

const filteredEducationLevels = computed(() =>
  matchedEducationLevels.value.length
    ? matchedEducationLevels.value
    : educationLevels.value,
);

const educationLevelOptions = computed<DropdownOption[]>(() => {
  if (props.classifications) return props.classifications.levels;
  const allowed = new Set(
    filteredEducationLevels.value.map((e) => normalizeValue(e.name)),
  )
  return sortedEducationLevels.value
    .filter((e) => allowed.has(normalizeValue(e.name)))
    .map((educationLevelOption) => ({
      id: educationLevelOption.name,
      name: educationLevelOption.name,
    }))
})

const classOptions = computed<DropdownOption[]>(() => {
  if (props.classifications) return adtClassOptions(props.classifications, level.value);
  if (!level.value.trim()) return [];

  return sortOptionsByNameAsc(
    classLevels.value
      .filter((classLevel) =>
        matchesEducationLevel(classLevel.educationLevel?.name, level.value),
      )
      .map((classLevel) => ({
        id: classLevel.name,
        name: classLevel.name,
      })),
  );
});

const subjectOptions = computed<DropdownOption[]>(() => {
  if (props.classifications) return adtSubjectOptions(props.classifications, level.value, standard.value);
  if (!level.value.trim() || !standard.value.trim()) return [];

  return sortOptionsByNameAsc(
    publicSubjects.value.map((publicSubject) => ({
      id: publicSubject.name,
      name: publicSubject.name,
    })),
  );
});

const isClassesLoading = computed(() => props.classifications ? props.disabled : classLevelsPending.value);

const isSubjectsLoading = computed(() => props.classifications ? props.disabled : publicSubjectsPending.value);

const showEducationLevelDropdown = computed(
  () => educationLevelOptions.value.length > 0,
);

watch(
  matchedEducationLevels,
  (matchedLevels) => {
    if (props.classifications) return;
    if (!matchedLevels.length) return;

    const currentLevelStillVisible = matchedLevels.some(
      (matchedLevel) => matchedLevel.name === level.value,
    );

    if (!currentLevelStillVisible && level.value) {
      onLevelChange("");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="flex flex-col items-center justify-between gap-4 px-4 my-5 xl:flex-row"
  >
    <form
      action=""
      class="flex flex-col items-center justify-center w-full gap-4 my-5 md:flex-row"
    >
      <CustomDropDownList
        v-if="showEducationLevelDropdown"
        id="home-education-level"
        :aria-label="content.selectLevel"
        :model-value="level"
        :list="educationLevelOptions"
        :placeholder="
          (props.classifications ? props.disabled : educationLevelsPending) ? content.loading : content.selectLevel
        "
        :disabled="props.classifications ? props.disabled : educationLevelsPending"
        :button-class="dropdownButtonClass"
        @update-model-value="onLevelChange"
      />

      <CustomDropDownList
        id="home-class-level"
        :aria-label="content.selectClass"
        :model-value="standard"
        :list="classOptions"
        :placeholder="
          props.classifications || level.trim()
            ? isClassesLoading
              ? content.loading
              : content.selectClass
            : content.selectLevelFirst
        "
        :disabled="props.disabled || (!props.classifications && !level.trim()) || !classOptions.length"
        :button-class="dropdownButtonClass"
        @update-model-value="onStandardChange"
      />

      <CustomDropDownList
        id="home-subject"
        :aria-label="content.selectSubject"
        :model-value="subject"
        :list="subjectOptions"
        :placeholder="
          (props.classifications || level.trim()) && standard.trim()
            ? isSubjectsLoading
              ? content.loading
              : content.selectSubject
            : content.selectClassFirst
        "
        :disabled="props.disabled || (!props.classifications && !level.trim()) || !standard.trim() || !subjectOptions.length"
        :button-class="dropdownButtonClass"
        @update-model-value="onSubjectChange"
      />
    </form>

    <HomeSearchbar
      :search-handler="props.classifications ? (value: string) => emit('emitSearch', value) : undefined"
      :language="props.language"
      :education-level="props.educationLevel"
    />
  </div>
</template>
