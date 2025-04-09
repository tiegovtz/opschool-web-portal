<script setup>
// Define State
const dropDownMenu = reactive({
  isOpen: false,
  currentIndex: null,
});

// Define Filters with visibility scope
const filterNameGroup = [
  {
    name: "Level",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { name: "Pre primary School" },
      { name: "Primary School" },
      { name: "Lower Secondary School" },
      { name: "Upper Secondary School" },
      { name: "Teacher Education" },
    ],
  },
  {
    name: "Subject",
    visibility: "all",
    inputType: "radio",
    filterGroup: [{ name: "Physics" }, { name: "Chemistry" }],
  },
  {
    name: "Category",
    visibility: "video",
    inputType: "radio",
    filterGroup: [{ name: "General" }, { name: "Vocational" }],
  },
  {
    name: "Class",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { name: "Form one" },
      { name: "Form Two" },
      { name: "Form Three" },
      { name: "Form Four" },
    ],
  },
  {
    name: "Format",
    visibility: "all",
    inputType: "radio",
    filterGroup: [
      { name: "Interactive Books" },
      { name: "Experiments" },
      { name: "Videos" },
      { name: "Audio" },
    ],
  },
  {
    name: "Language",
    visibility: "all",
    inputType: "checkbox",
    filterGroup: [{ name: "English" }, { name: "French" }, { name: "Swahili" }],
  },
  {
    name: "Skills",
    visibility: "all",
    inputType: "checkbox",
    filterGroup: [
      { name: "Child Protection" },
      { name: "Social Policy" },
      { name: "Knowledge Management" },
    ],
  },
];

// Toggle dropdown
const toggleMenu = (index) => {
  if (dropDownMenu.currentIndex === index) {
    dropDownMenu.isOpen = !dropDownMenu.isOpen;
  } else {
    dropDownMenu.currentIndex = index;
    dropDownMenu.isOpen = true;
  }
};

// Define Emits
const emit = defineEmits(["emitUpdatefilterName", "emitUpdateFilterValue"]);

// Define Props
defineProps({
  filterName: {
    type: String,
  },
  filterValue: Array,
  activeTab: String,
});

//
const checkbox = (event) => {
  const container = event.currentTarget;
  const input =
    container.querySelector('input[type="checkbox"]') ??
    container.querySelector('input[type="radio"]');
  if (input) {
    input.checked = !input.checked;

    input.checked
      ? emit("emitUpdateFilterValue", input.value)
      : emit("emitUpdateFilterValue", null);
  }
};
</script>

<template>
  <form
    class="flex flex-col w-full bg-white cursor-pointer"
    @reset="emit('emitUpdateFilterValue', null)"
  >
    <!-- Header and Reset Button -->
    <div class="flex justify-between w-full px-3 py-2">
      <h2 class="font-bold tracking-wider text-medium">Filters</h2>
      <button type="reset" class="underline transition-all duration-500 ease-in-out hover:text-deepBlue text-oceanBlue">
        Reset
      </button>
    </div>
    <!-- Dropdown Header -->
    <div
      v-for="(filters, index) in filterNameGroup"
      :key="index"
      class="flex flex-col items-center w-full"
    >
      <!-- Dropdown Header -->
      <div
        :class="[
          'flex justify-between items-center border-b border-deepBlue border-opacity-10 w-full px-5 py-2',
          {
            '!border-b-0':
              dropDownMenu.isOpen && dropDownMenu.currentIndex === index,
          },
        ]"
        @click="toggleMenu(index)"
        v-if="
          filters.visibility === 'all' ||
          filters.visibility == activeTab.toLowerCase()
        "
      >
        <h2 class="font-medium tracking-wider text-medium">
          {{ filters.name }}
        </h2>
        <Icon
          :name="
            dropDownMenu.isOpen && dropDownMenu.currentIndex === index
              ? 'lets-icons:remove-duotone'
              : 'lets-icons:add-duotone'
          "
          size="24"
          class="text-deepBlue"
        />
      </div>

      <!-- Dropdown Content -->
      <div
        :class="[
          'flex flex-col overflow-hidden justify-between transition-all duration-500 ease-in-out items-center w-full px-5',
          dropDownMenu.isOpen && dropDownMenu.currentIndex === index
            ? 'h-auto'
            : 'h-0 p-0',
        ]"
      >
        <div
          v-for="(filter, i) in filters.filterGroup"
          :key="i"
          @click="checkbox"
          class="flex items-center w-full gap-4 pl-6 border-b cursor-pointer border-deepBlue border-opacity-10"
        >
          <!-- <Icon name="gridicons:add" size="20" class="text-normalGreener" /> -->
          <input
            :type="filters.inputType"
            :name="filters.name.toLowerCase().replaceAll(' ', '-')"
            :id="filter.name.replaceAll(' ', '-').toLowerCase()"
            :value="filter.name"
            :checked="filters.visibility == activeTab.toLowerCase()"
          />
          {{ filter.name }}
        </div>
      </div>
    </div>
  </form>
</template>
