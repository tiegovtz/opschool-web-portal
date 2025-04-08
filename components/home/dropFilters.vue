<template>
  <form class="w-full flex flex-col bg-white cursor-pointer" @reset="resetFilters">
    <div class="flex justify-end w-full p-2">
      <button type="reset" class="text-blue-600 font-semibold">Reset</button>
    </div>

    <div
      v-for="(filter, index) in visibleFilters"
      :key="index"
      class="flex flex-col items-center w-full"
    >
      <!-- Header -->
      <div
        class="flex justify-between items-center border-b border-gray-300 w-full px-5 py-2"
        :class="{ '!border-b-0': dropdown.isOpen && dropdown.currentIndex === index }"
        @click="toggleMenu(index)"
      >
        <h2 class="text-medium font-medium tracking-wider">
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
        class="flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-full px-5"
        :class="dropdown.isOpen && dropdown.currentIndex === index ? 'h-auto py-2' : 'h-0 p-0'"
      >
        <div
          v-for="(value, i) in filter.values"
          :key="i"
          class="flex gap-3 items-center py-1 border-b border-gray-100 w-full pl-6"
        >
          <input
            type="checkbox"
            :id="`${filter.key}-${i}`"
            :value="value"
            v-model="selectedFilters[filter.key]"
            @change="emitSelected()"
          />
          <label :for="`${filter.key}-${i}`">{{ formatValue(value) }}</label>
        </div>
      </div>
    </div>
  </form>
</template>

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
    f.key !== 'isActive'
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
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'string' && value.includes('T')) {
    return new Date(value).toLocaleString()
  }
  return value
}
</script>

<style scoped>
/* Optional: smooth checkbox transition or custom styles */
</style>
