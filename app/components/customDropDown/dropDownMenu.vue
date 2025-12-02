<script setup>
import { reactive, ref, computed, nextTick } from 'vue';
import debounce from 'lodash/debounce';
import apiDocs from '~/utilities/api-docs';

const token = useCookie('signInAccessToken').value;
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};

const isLoading = ref(true);

// Fetch data from server
const { data: educationLevels } = await useFetch(apiDocs.educationLevel.getEducationLevels, { headers });
const { data: classes } = await useFetch(apiDocs.levels.getLevels, { headers });
const { data: subjects } = await useFetch(apiDocs.subjects.getPublicSubjects, { headers });
// const { data: languages } = await useFetch(apiDocs.languages.getLanguages, { headers });
// const { data: skills } = await useFetch(apiDocs.skills.getSkills, { headers });

// Simulate a short delay for skeleton visibility
setTimeout(() => {
  isLoading.value = false;
}, 500);

const dropDownMenu = reactive({
  openMenus: [0],
});

const selectedFilters = reactive({});

const emit = defineEmits([
  "emitUpdatefilterName",
  "emitUpdateFilterValue"
]);

const props = defineProps({
  filterName: String,
  filterValue: Array,
  activeTab: String,
});

const setMenuOpen = (index) => {
  const i = dropDownMenu.openMenus.indexOf(index);
  if (i > -1) {
    dropDownMenu.openMenus.splice(i, 1);
  } else {
    dropDownMenu.openMenus.push(index);
  }
};

const resetFilters = () => {
  Object.keys(selectedFilters).forEach((key) => delete selectedFilters[key]);
  emitFilterPayload();
};

const selectLevel = async (levelName) => {
  selectedFilters.level = levelName;
  selectedFilters.class = [];
  selectedFilters.subject = [];
  await nextTick();
  emitFilterPayload();
};


const selectClass = async (className) => {
  if (!selectedFilters.class) selectedFilters.class = [];
  selectedFilters.class.push(className);
  await nextTick();
  emitFilterPayload();
};

const selectSubject = async (subjectName) => {
  if (!selectedFilters.subject) selectedFilters.subject = [];
  selectedFilters.subject.push(subjectName);
  await nextTick();
  emitFilterPayload();
};


const toggleCheckbox = (key, value) => {
  if (!selectedFilters[key]) selectedFilters[key] = [];
  const index = selectedFilters[key].indexOf(value);
  if (index > -1) {
    selectedFilters[key].splice(index, 1);
    if (selectedFilters[key].length === 0) delete selectedFilters[key];
  } else {
    selectedFilters[key].push(value);
  }
  emitFilterPayload();
};

const emitFilterPayload = debounce(() => {
  const rawFilters = JSON.parse(JSON.stringify(selectedFilters));
  const queryObject = {};

  for (const key in rawFilters) {
    let apiKey = key;
    if (key === 'level') apiKey = 'educationLevel';
    else if (key === 'class') apiKey = 'level';

    const val = rawFilters[key];
    if (Array.isArray(val)) {
      queryObject[apiKey] = val.toString().toLowerCase();
    } else {
      queryObject[apiKey] = val.toString().toLowerCase();
    }
  }

  emit("emitUpdateFilterValue", queryObject);
}, 100);

const filterNameGroup = computed(() => {
  if (isLoading.value) return [];
  const filters = [];

  if (Array.isArray(educationLevels?.value) && educationLevels.value.length > 0) {
    filters.push({
      name: 'level',
      visibility: 'all',
      inputType: 'radio',
      filterGroup: educationLevels.value.map((level) => ({ name: level.name }))
    });
  }

  if (Array.isArray(classes?.value)) {
    filters.push({
      name: 'class',
      visibility: 'all',
      inputType: 'radio',
      filterGroup: classes.value.reduce((acc, cls) => {
        const existing = acc.find((g) => g.level === cls.educationLevel?.name);
        if (existing) {
          existing.classes.push(cls.name);
        } else {
          acc.push({ level: cls.educationLevel?.name, classes: [cls.name] });
        }
        return acc;
      }, [])
    });
  }

  if (Array.isArray(subjects?.value) && props.activeTab.toLowerCase() !=='home') {
    filters.push({
      name: 'subject',
      visibility: 'all',
      inputType: 'radio',
      filterGroup: subjects.value.reduce((acc, subj) => {
        const existing = acc.find((g) => g.level === subj.educationLevel);
        if (existing) {
          existing.list.push(subj.name);
        } else {
          acc.push({ level: subj.educationLevel, list: [subj.name] });
        }
        return acc;
      }, [])
    });
  }
  
  // if (Array.isArray(languages?.value)) {
  //   filters.push({
  //     name: 'language',
  //     visibility: 'all',
  //     inputType: 'radio',
  //     filterGroup: languages.value.map((lang) => ({ name: lang.name }))
  //   });
  // }

  // if (Array.isArray(skills?.value)) {
  //   filters.push({
  //     name: 'skills',
  //     visibility: 'all',
  //     inputType: 'radio',
  //     filterGroup: skills.value.map((skill) => ({ name: skill.name }))
  //   });
  // }
  
  return filters;
});


const visibleFilters = computed(() => {
  return filterNameGroup.value.filter((filter) => {

    if (filter.name === 'class' || filter.name === 'subject') {
      return selectedFilters.level && (filter.visibility === "all" || filter.visibility === props.activeTab);
    }

    return filter.visibility === "all" || filter.visibility === props.activeTab;
  });
});


// Check visible filters
watch(() => props.activeTab, () => {
  const openMenus = [];
  visibleFilters.value.forEach((_, index) => {
    openMenus.push(index);
  });
  dropDownMenu.openMenus = openMenus;
});

watch(() => selectedFilters.level, () => {
  const openMenus = [];
  visibleFilters.value.forEach((_, index) => {
    openMenus.push(index);
  });
  dropDownMenu.openMenus = openMenus;
});

</script>

<template>
  <div v-if="isLoading" role="status" aria-live="polite">
    <p class="text-gray-400 animate-pulse">Loading filters...</p>
  </div>

  <form v-else class="flex flex-col w-full bg-white divide-y divide-gray-200" @reset="resetFilters"
    aria-label="Content filters">
    <!-- Filter legend and reset button -->
    <div class="flex items-center justify-between p-4 border-b bg-gray-50">
      <h2 class="text-lg font-bold text-gray-700">Filter</h2>
      <button type="reset"
        class="px-3 py-1 text-sm transition-all duration-500 ease-in-out border rounded-md text-oceanBlue border-oceanBlue hover:bg-deepBlue hover:text-white hover:border-deepBlue">
        Reset Filters
      </button>
    </div>

    <div v-for="(filter, index) in visibleFilters" :key="index" class="p-4"
      :aria-labelledby="`filter-heading-${index}`">
      <!-- Accordion toggle -->
      <button type="button" class="flex items-center justify-between w-full text-left" @click="setMenuOpen(index)"
        :aria-expanded="dropDownMenu.openMenus.includes(index)" :aria-controls="`filter-panel-${index}`">
        <h3 class="text-lg font-semibold capitalize" :id="`filter-heading-${index}`">
          {{ filter.name }}
        </h3>
        <span>
          <Icon :name="dropDownMenu.openMenus.includes(index)
            ? 'lets-icons:remove-duotone'
            : 'lets-icons:add-duotone'" size="1.2rem" class="text-deepBlue" />
        </span>
      </button>

      <transition name="fade">
        <div v-if="dropDownMenu.openMenus.includes(index)" class="mt-2 space-y-2" :id="`filter-panel-${index}`"
          role="region" :aria-labelledby="`filter-heading-${index}`">
          <!-- LEVEL -->
          <div v-if="filter.name.toLowerCase() === 'level'">
            <fieldset>
              <legend class="sr-only">Filter by education level</legend>
              <label v-for="option in filter.filterGroup" :key="option.name" class="flex items-center gap-2">
                <input :type="filter.inputType" :value="option.name" name="level" @change="selectLevel(option.name)"
                  :checked="selectedFilters.level === option.name" class="capitalize" />
                {{ option.name }}
              </label>
            </fieldset>
          </div>

          <!-- CLASS -->
          <div v-else-if="filter.name === 'class'">
            <div v-if="!selectedFilters.level" class="text-sm text-red-500" role="alert">
              Please select a level first.
            </div>
            <fieldset v-else>
              <legend class="sr-only">Filter by class</legend>
              <div v-for="group in filter.filterGroup" :key="group.level + selectedFilters.level">
                <div v-if="group.level?.toLowerCase() === selectedFilters.level?.toLowerCase()">
                  <label v-for="className in group.classes" :key="className" class="flex items-center gap-2">
                    <input :type="filter.inputType" :value="className" name="class" @change="selectClass(className)"
                      :checked="selectedFilters.class?.includes(className)" />
                    {{ className }}
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <!-- SUBJECT -->
          <div v-else-if="filter.name === 'subject' && activeTab.toLowerCase()!=='home'">
            <div v-if="!selectedFilters.level" class="text-sm text-red-500" role="alert">
              Please select a level first.
            </div>
            <fieldset v-else>
              <legend class="sr-only">Filter by subject</legend>
              <div v-for="group in filter.filterGroup" :key="group.level + selectedFilters.level">
                <div v-if="group.level === selectedFilters.level">
                  <label v-for="subject in group.list" :key="subject" class="flex items-center gap-2">
                    <input :type="filter.inputType" :value="subject"
                      :checked="selectedFilters.subject?.includes(subject)" @change="selectSubject(subject)" />
                    {{ subject }}
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <!-- GENERAL FILTER (Language, Skills, etc.) -->
          <!-- <div v-else>
            <fieldset>
              <legend class="sr-only">Filter by {{ filter.name }}</legend>
              <label v-for="option in filter.filterGroup" :key="option.name" class="flex items-center gap-2">
                <input :type="filter.inputType" :value="option.name" class="capitalize"
                  :checked="selectedFilters[filter.name.toLowerCase()]?.includes(option.name)"
                  @change="toggleCheckbox(filter.name.toLowerCase(), option.name)" />
                {{ option.name }}
              </label>
            </fieldset>
          </div> -->
        </div>
      </transition>
    </div>
  </form>
</template>



<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
