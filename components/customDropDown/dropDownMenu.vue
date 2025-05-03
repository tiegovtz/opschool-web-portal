<script setup>
import { reactive, ref, computed, nextTick, toRaw } from 'vue';
import debounce from 'lodash/debounce';

const dropDownMenu = reactive({
  openMenus: [0, 1, 2],
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

// Emit Filter Payload Function
const emitFilterPayload = debounce(() => {
  const rawFilters = JSON.parse(JSON.stringify(selectedFilters));
  const queryObject = {};

  for (const key in rawFilters) {
    let apiKey = key;
    
    // Check and convert specific keys to lowercase
    if (key === 'level') apiKey = 'educationLevel';
    else if (key === 'class') apiKey = 'level';

    const val = rawFilters[key];
    if (Array.isArray(val)) {
      queryObject[apiKey.toLowerCase()] = val.toString().toLowerCase();
    } else {
      queryObject[apiKey.toLowerCase()] = val.toString().toLowerCase();
    }
  }

  emit("emitUpdateFilterValue", queryObject);
}, 100);

const filterNameGroup = [
  {
    name: "Level",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { name: "Lower Secondary" },
      { name: "Upper Secondary" },
      { name: "Teacher Education" },
    ],
  },
  {
    name: "Class",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      {
        level: "Lower Secondary",
        classes: ["Form 1", "Form 2", "Form 3", "Form 4"],
      },
      {
        level: "Upper Secondary",
        classes: ["Form 5", "Form 6"],
      },
      {
        level: "Teacher Education",
        classes: ["Level 1", "Level 2", "Level 3", "Level 4"],
      },
    ],
  },
  {
    name: "Subject",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { level: "Pre Primary", list: ["Counting", "Writting"] },
      {
        level: "Primary",
        list: ["Kiswahili", "Mathematics", "Science", "Social Studies"],
      },
      {
        level: "Lower Secondary",
        list: [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology",
          // "Geography",
        ],
      },
      {
        level: "Upper Secondary",
        list: [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology",
          // "Geography",
        ],
      },
    ],
  },
  {
    name: "Category",
    visibility: "video",
    inputType: "radio",
    filterGroup: [{ name: "General" }, { name: "Vocational" }],
  },
  {
    name: "Language",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { name: "English" },
      { name: "Kiswahili" },
    ],
  },
  {
    name: "Skills",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { name: "Child Protection" },
      { name: "Social Policy" },
      { name: "Knowledge Management" },
    ],
  },
];

const visibleFilters = computed(() => {
  return filterNameGroup.filter(
    (filter) => filter.visibility === "all" || filter.visibility === props.activeTab
  );
});
</script>

<template>
  <form class="flex flex-col w-full bg-white divide-y divide-gray-200 cursor-pointer" @reset="resetFilters">
    <!-- Filter legend and reset button -->
    <div class="flex items-center justify-between p-4 border-b bg-gray-50">
      <h2 class="text-lg font-bold text-gray-700">Filter</h2>
      <button type="reset"
        class="px-3 py-1 text-sm transition-all duration-500 ease-in-out border rounded-md text-oceanBlue border-oceanBlue hover:bg-deepBlue hover:text-white hover:border-deepBlue">
        Reset Filters
      </button>
    </div>

    <div v-for="(filter, index) in visibleFilters" :key="index" class="p-4">
      <div @click="setMenuOpen(index)" class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ filter.name }}</h3>
        <span>
          <Icon :name="dropDownMenu.openMenus.includes(index) ?
    'lets-icons:remove-duotone' :
    'lets-icons:add-duotone'" size="1.2rem" class="text-deepBlue" />
        </span>
      </div>

      <transition name="fade">
        <div v-if="dropDownMenu.openMenus.includes(index)" class="mt-2 space-y-2">
          <!-- LEVEL -->
          <div v-if="filter.name === 'Level'">
            <label v-for="option in filter.filterGroup" :key="option.name" class="flex items-center gap-2">
              <input type="radio" :value="option.name" name="level" @change="selectLevel(option.name)"
                :checked="selectedFilters.level === option.name" />
              {{ option.name }}
            </label>
          </div>

          <!-- CLASS -->
          <div v-else-if="filter.name === 'Class'">
            <div v-if="!selectedFilters.level" class="text-sm text-red-500">
              Please select a level first.
            </div>
            <div v-else v-for="group in filter.filterGroup" :key="group.level + selectedFilters.level">
              <div v-if="group.level.toLowerCase() === selectedFilters.level?.toLowerCase()">
                <label v-for="className in group.classes" :key="className" class="flex items-center gap-2"
                  @click.prevent="toggleCheckbox('class', className)">
                  <input type="radio" :value="className" :checked="selectedFilters.class?.includes(className)" />
                  {{ className }}
                </label>
              </div>
            </div>
          </div>

          <!-- SUBJECT -->
          <div v-else-if="filter.name === 'Subject'">
            <div v-if="!selectedFilters.level" class="text-sm text-red-500">
              Please select a level first.
            </div>
            <div v-else v-for="group in filter.filterGroup" :key="group.level + selectedFilters.level">
              <div v-if="group.level === selectedFilters.level">
                <label v-for="subject in group.list" :key="subject" class="flex items-center gap-2"
                  @click.prevent="toggleCheckbox('subject', subject)">
                  <input type="radio" :value="subject" :checked="selectedFilters.subject?.includes(subject)" />
                  {{ subject }}
                </label>
              </div>
            </div>
          </div>

          <!-- GENERAL FILTER (Category, Language, Skills) -->
          <div v-else>
            <label v-for="option in filter.filterGroup" :key="option.name" class="flex items-center gap-2"
              @click.prevent="toggleCheckbox(filter.name.toLowerCase(), option.name)">
              <input :type="filter.inputType" :value="option.name"
                :checked="selectedFilters[filter.name.toLowerCase()]?.includes(option.name)" />
              {{ option.name }}
            </label>
          </div>
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
