<script setup lang="ts">
import type { ClassLevel } from "~/types/classlevel.interface";
import type { educationLevel } from "~/types/educationlevel.interface";
import type { LanguageSupport } from "~/types/language.interface";
import type { Subjects } from "~/types/subject.interface";
import apiDocs from "~/utilities/apiDocs";

type DropdownOption = {
  id: string;
  name: string;
};

type PrimaryGrade = {
  id?: number | string;
  gradeId?: number | string;
  gradeName: string;
  name?: string;
};

type PrimarySubject = {
  name?: string;
  subjectName?: string;
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

const getEducationBucket = (value?: string | null) => {
  const normalizedValue = normalizeValue(value);

  if (
    ["primary", "primary education", "elimu ya msingi", "msingi"].includes(
      normalizedValue,
    )
  ) {
    return "primary";
  }

  if (
    [
      "secondary",
      "secondary education",
      "elimu ya sekondari",
      "sekondari",
    ].includes(normalizedValue)
  ) {
    return "secondary";
  }

  return normalizedValue || null;
};

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
    return (a?.name ?? "").localeCompare(b?.name ?? "")
  })
})

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
        selectLevelFirst: "Chagua ngazi kwanza",
        selectSubject: "Chagua somo",
        selectClassFirst: "Chagua darasa kwanza",
        loading: "Inapakia...",
      }
    : {
        selectLevel: "Select education level",
        selectClass: "Select class",
        selectLevelFirst: "Select level first",
        selectSubject: "Select subject",
        selectClassFirst: "Select class first",
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

  if (bucket === "secondary") {
    return props.language === "kiswahili"
      ? "Elimu ya Sekondari"
      : "Secondary Education";
  }

  return educationLevelName;
};

const dropdownButtonClass =
  "h-10 w-full rounded-none border-b border-gray-300 px-2 py-2 text-left text-sm text-gray-700 shadow-none focus:border-oceanBlue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const primaryGradesUrl = `${apiDocs.primary.getGradesByLevel}?levelId=2&source=Tet&section=REGULAR_ACTIVITIES`;

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

const { data: secondaryClasses, pending: secondaryClassesPending } = useFetch<
  ClassLevel[]
>(apiDocs.levels.getLevels, {
  headers,
  default: () => [],
});

const { data: secondarySubjects, pending: secondarySubjectsPending } = useFetch<
  Subjects[]
>(apiDocs.subjects.getPublicSubjects, {
  headers,
  default: () => [],
});

const { data: primaryGrades, pending: primaryGradesPending } = useFetch<
  PrimaryGrade[]
>(primaryGradesUrl, {
  headers,
  default: () => [],
  immediate: isPrimaryModule.value,
});

const selectedPrimaryGrade = computed<PrimaryGrade | null>(() => {
  if (!isPrimaryModule.value || !standard.value.trim()) return null;

  return (
    primaryGrades.value.find(
      (grade) =>
        normalizeValue(grade.gradeName ?? grade.name) ===
        normalizeValue(standard.value),
    ) ?? null
  );
});

const selectedPrimaryGradeId = computed<number | string | null>(() => {
  const grade = selectedPrimaryGrade.value;
  return grade?.gradeId ?? grade?.id ?? null;
});

const primarySubjects = ref<PrimarySubject[]>([]);
const primarySubjectsPending = ref(false);

watch(
  selectedPrimaryGradeId,
  async (gradeId) => {
    if (!isPrimaryModule.value || !gradeId) {
      primarySubjects.value = [];
      return;
    }

    primarySubjectsPending.value = true;

    try {
      primarySubjects.value = await $fetch<PrimarySubject[]>(
        apiDocs.primary.getSubjectsByGrade + `?gradeId=${gradeId}&source=Tet`,
        { headers },
      );
    } catch (error) {
      console.error("Failed to fetch primary subjects:", error);
      primarySubjects.value = [];
    } finally {
      primarySubjectsPending.value = false;
    }
  },
  { immediate: true },
);

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

const educationLevelOptions = computed<DropdownOption[]>(() =>
  filteredEducationLevels.value.map((educationLevelOption) => ({
    id: normalizeValue(educationLevelOption.name),
    name: getEducationLevelLabel(educationLevelOption.name),
  })),
);

const classOptions = computed<DropdownOption[]>(() => {
  if (!level.value.trim()) return [];

  if (isPrimaryModule.value) {
    return primaryGrades.value.map((grade) => ({
      id: grade.gradeName,
      name: grade.gradeName,
    }));
  }

  return secondaryClasses.value
    .filter((classLevel) =>
      matchesEducationLevel(classLevel.educationLevel?.name, level.value),
    )
    .map((classLevel) => ({
      id: classLevel.name,
      name: classLevel.name,
    }));
});

const subjectOptions = computed<DropdownOption[]>(() => {
  if (!level.value.trim() || !standard.value.trim()) return [];

  if (isPrimaryModule.value) {
    return primarySubjects.value
      .map(
        (primarySubject) => primarySubject.subjectName ?? primarySubject.name,
      )
      .filter((subjectName): subjectName is string =>
        Boolean(subjectName?.trim()),
      )
      .map((subjectName) => ({
        id: subjectName,
        name: subjectName,
      }));
  }

  return secondarySubjects.value.map((secondarySubject) => ({
    id: secondarySubject.name,
    name: secondarySubject.name,
  }));
});

const isClassesLoading = computed(() =>
  isPrimaryModule.value
    ? primaryGradesPending.value
    : secondaryClassesPending.value,
);

const isSubjectsLoading = computed(() =>
  isPrimaryModule.value
    ? primarySubjectsPending.value
    : secondarySubjectsPending.value,
);

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
        :list="sortedEducationLevels"
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
