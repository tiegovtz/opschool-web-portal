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
      { name: "Primary School" },
      { name: "Secondary School" },
      { name: "High School" },
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
  const input = container.querySelector('input[type="checkbox"]') || container.querySelector('input[type="radio"]');
  if (input) {
    input.checked = !input.checked;
  }
};
</script>

<template>
  <form action="">
    <div class="w-full flex flex-col bg-white cursor-pointer">
      <div
        v-for="(filters, index) in filterNameGroup"
        :key="index"
        class="flex flex-col items-center w-full"
      >
        <!-- Dropdown Header -->
        <div
          class="flex justify-between items-center border-b border-deepBlue w-full px-5 py-2"
          @click="toggleMenu(index)"
          v-if="
            filters.visibility === 'all' ||
            filters.visibility == activeTab.toLowerCase()
          "
        >
          <h2 class="text-medium font-medium tracking-wider">
            {{ filters.name }}
          </h2>
          <Icon
            name="iconoir:nav-arrow-down"
            size="20"
            class="text-deepBlue transition-transform duration-500 ease-in-out"
            :class="{
              'transform rotate-180':
                dropDownMenu.isOpen && dropDownMenu.currentIndex === index,
            }"
          />
        </div>

        <!-- Dropdown Content -->
        <div
          class="flex flex-col overflow-hidden justify-between transition-all duration-500 ease-in-out items-center w-full px-5"
          :class="
            dropDownMenu.isOpen && dropDownMenu.currentIndex === index
              ? 'h-auto'
              : 'h-0 p-0'
          "
        >
          <div
            v-for="(filter, i) in filters.filterGroup"
            :key="i"
            @click="checkbox"
            class="flex gap-4 cursor-pointer items-center border-b border-deepBlue pl-6 w-full"
          >
            <!-- <Icon name="gridicons:add" size="20" class="text-normalGreener" /> -->
            <input
              :type="filters.inputType"
              :name="filters.name.toLowerCase().replaceAll(' ', '-')"
              :id="filter.name.replaceAll(' ', '-').toLowerCase()"
              :value="filter.name"
            />

            <label class="cursor-pointer" :for="filter.name.replaceAll(' ', '-').toLowerCase()">{{
              filter.name
            }}</label>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>
