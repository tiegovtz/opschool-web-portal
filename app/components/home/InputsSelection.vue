<script setup lang="ts">
import type { ClassLevel } from "~/types/classlevel.interface";
import type { educationLevel } from "~/types/educationlevel.interface";
import type { LanguageSupport } from "~/types/language.interface";
import type { Subjects } from "~/types/subject.interface";
import apiDocs from "~/utilities/apiDocs";
import {
  getApiContentLanguage,
  normalizeEducationLevel,
} from "~/utilities/educationRoute";

type DropdownOption = {
  id: string;
  name: string;
};

const props = withDefaults(
  defineProps<{ educationLevel?: string; language?: LanguageSupport }>(),
  {
    language: "english",
  },
);

const emit = defineEmits<{
  (event: "emitLevel", value: string): void;
  (event: "emitStandard", value: string): void;
  (event: "emitSubject", value: string): void;
}>();

const normalizeValue = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const getEducationBucket = (value?: string | null) =>
  value?.trim() ? normalizeEducationLevel(value) : null;

const isPrimaryModule = computed(
  () => getEducationBucket(props.educationLevel) === "primary",
);

const level = ref<string>(isPrimaryModule.value ? "primary" : "");
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

const getEducationLevelLabel = (educationLevelName: string) => {
  const bucket = getEducationBucket(educationLevelName);

  if (bucket === "primary") {
    return props.language === "kiswahili"
      ? "Elimu ya Msingi"
      : "Primary Education";
  }

  // if (bucket === "lower secondary" || bucket === "secondary") {
  //   return props.language === "kiswahili"
  //     ? "Elimu ya Sekondari"
  //     : "Secondary Education";
  // }

  return educationLevelName;
};

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
  headers,
  default: () => [],
});

const selectedEducationBucket = computed(
  () => getEducationBucket(level.value || props.educationLevel),
);

const { data: classLevels, pending: classLevelsPending } = useFetch<
  ClassLevel[]
>(apiDocs.levels.getLevels, {
  headers,
  query: computed(() =>
    selectedEducationBucket.value
      ? { educationLevel: selectedEducationBucket.value }
      : {},
  ),
  default: () => [],
  watch: [selectedEducationBucket],
});

const { data: publicSubjects, pending: publicSubjectsPending } = useFetch<
  Subjects[]
>(apiDocs.subjects.getPublicSubjects, {
  headers,
  query: computed(() => {
    if (!selectedEducationBucket.value) return {};

    const apiLanguage = getApiContentLanguage(
      selectedEducationBucket.value,
      props.language,
    );

    return {
      educationLevel: selectedEducationBucket.value,
      ...(apiLanguage ? { language: apiLanguage } : {}),
    };
  }),
  default: () => [],
  watch: [level],
});

const matchedEducationLevels = computed(() => {
  if (!props.educationLevel || !educationLevels.value.length) return [];

  return educationLevels.value.filter((educationLevelOption) =>
    matchesEducationLevel(educationLevelOption.name, props.educationLevel),
  );
});

const filteredEducationLevels = computed(() =>
  matchedEducationLevels.value.length
    ? matchedEducationLevels.value
    : educationLevels.value,
);

const isEducationLevelLocked = computed(
  () => matchedEducationLevels.value.length === 1,
);

const educationLevelOptions = computed<DropdownOption[]>(() => {
  const allowed = new Set(
    filteredEducationLevels.value.map((e) => normalizeValue(e.name)),
  )
  return sortedEducationLevels.value
    .filter((e) => allowed.has(normalizeValue(e.name)))
    .map((educationLevelOption) => ({
      id: normalizeValue(educationLevelOption.name),
      name: getEducationLevelLabel(educationLevelOption.name),
    }))
})

const classOptions = computed<DropdownOption[]>(() => {
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
  if (!level.value.trim() || !standard.value.trim()) return [];

  return sortOptionsByNameAsc(
    publicSubjects.value.map((publicSubject) => ({
      id: publicSubject.name,
      name: publicSubject.name,
    })),
  );
});

const isClassesLoading = computed(() => classLevelsPending.value);

const isSubjectsLoading = computed(() => publicSubjectsPending.value);

const showEducationLevelDropdown = computed(() => !isPrimaryModule.value);

watch(
  matchedEducationLevels,
  (matchedLevels) => {
    if (!matchedLevels.length) return;

    const nextLevel = normalizeValue(matchedLevels[0]?.name);
    if (!nextLevel || level.value === nextLevel) return;

    onLevelChange(nextLevel);
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
        :model-value="level"
        :list="educationLevelOptions"
        :placeholder="
          educationLevelsPending ? content.loading : content.selectLevel
        "
        :disabled="isEducationLevelLocked"
        :button-class="dropdownButtonClass"
        @update-model-value="onLevelChange"
      />

      <CustomDropDownList
        id="home-class-level"
        :model-value="standard"
        :list="classOptions"
        :placeholder="
          level.trim()
            ? isClassesLoading
              ? content.loading
              : content.selectClass
            : content.selectLevelFirst
        "
        :disabled="!level.trim() || !classOptions.length"
        :button-class="dropdownButtonClass"
        @update-model-value="onStandardChange"
      />

      <CustomDropDownList
        id="home-subject"
        :model-value="subject"
        :list="subjectOptions"
        :placeholder="
          level.trim() && standard.trim()
            ? isSubjectsLoading
              ? content.loading
              : content.selectSubject
            : content.selectClassFirst
        "
        :disabled="!level.trim() || !standard.trim() || !subjectOptions.length"
        :button-class="dropdownButtonClass"
        @update-model-value="onSubjectChange"
      />
    </form>

    <HomeSearchbar
      :language="props.language"
      :education-level="props.educationLevel"
    />
  </div>
</template>
