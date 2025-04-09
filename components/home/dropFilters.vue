
<script setup>
import { reactive, ref, computed, onMounted } from 'vue'

const props = defineProps({
  filterData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['emitUpdateFilterValue'])

const selectedFilters = reactive({})
const dropdown = reactive({ isOpen: false, currentIndex: null })

// Filter unwanted keys
const visibleFilters = computed(() => {
  return props.filterData.filter(f =>
    !f.key.startsWith('_') &&
    f.key !== 'createdAt' &&
    f.key !== 'updatedAt' &&
    f.key !== 'isDeleted' &&
    f.key !== 'isActive' &&
    f.key !== 'thumbnail' &&
    f.key !== 'descriptions' &&
    f.key !== 'views' &&
    f.key !== 'isViewed'&&
    f.key !== 'progressPercent'&&
    f.key !== 'stepsFileUrl'&&
    f.key !== 'description'&&
    f.key !== 'videoFileUrl'
  )
})

// Initialize selectedFilters
onMounted(() => {
  visibleFilters.value.forEach(f => {
    selectedFilters[f.key] = []
  })
})

const toggleMenu = (index) => {
  if (dropdown.currentIndex === index) {
    dropdown.isOpen = !dropdown.isOpen
  } else {
    dropdown.currentIndex = index
    dropdown.isOpen = true
  }
}

const emitSelected = () => {
  const activeFilters = {}
  for (const key in selectedFilters) {
    if (selectedFilters[key].length) {
      activeFilters[key] = selectedFilters[key]
    }
  }
  emit('emitUpdateFilterValue', activeFilters)
}

const resetFilters = () => {
  visibleFilters.value.forEach(f => {
    selectedFilters[f.key] = []
  })
  emit('emitUpdateFilterValue', null)
}

const formatLabel = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

const formatValue = (value) => {
  const dateReg = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'string' && value.match(dateReg)) {
    return new Date(value).toLocaleString()
  }
  return value
}
</script>

<template>
  <form class="flex flex-col w-full bg-white cursor-pointer" @reset="resetFilters">
    <!-- Header and Reset Button -->
    <div class="flex justify-between w-full px-3 py-2">
      <h2 class="font-bold tracking-wider text-medium">Filters</h2>
      <button type="reset" class="underline transition-all duration-500 ease-in-out hover:text-deepBlue text-oceanBlue">
        Reset
      </button>
    </div>

    <div
      v-for="(filter, index) in visibleFilters"
      :key="index"
      class="flex flex-col items-center w-full"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between w-full px-5 py-2 border-b border-gray-300"
        :class="{ '!border-b-0': dropdown.isOpen && dropdown.currentIndex === index }"
        @click="toggleMenu(index)"
      >
        <h2 class="font-medium tracking-wider text-medium">
          {{ formatLabel(filter.key) }}
        </h2>
        <Icon
            :name="dropdown.isOpen && dropdown.currentIndex === index ? 
            'lets-icons:remove-duotone' : 
            'lets-icons:add-duotone'"
            size="24" class="text-deepBlue"/>
      </div>

      <!-- Content -->
      <div
        class="flex flex-col w-full px-5 overflow-hidden transition-all duration-300 ease-in-out"
        :class="dropdown.isOpen && dropdown.currentIndex === index ? 'h-auto py-2' : 'h-0 p-0'"
      >
        <div
          v-for="(value, i) in filter.values"
          :key="i"
          class="flex items-center w-full gap-3 py-1 pl-6 border-b border-gray-100"
        >
          <input
            type="checkbox"
            :id="`${filter.key}-${i}`"
            :value="value"
            v-model="selectedFilters[filter.key]"
            @change="emitSelected()"
          />
          <label :for="`${filter.key}-${i}`">{{ typeof(value) === 'string' ? formatValue(value) : formatValue(value?.name) }}</label>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
/* Optional: smooth checkbox transition or custom styles */
</style>
