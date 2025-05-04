<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  list: {
    type: Array,
    required: true
  },
  modelValue: {
    type: [String, Number, Object],
    default: null
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  }
});

const emit = defineEmits(['updateModelValue']);

const isOpen = ref(false);
const selected = ref(props.modelValue);
const dropdownRef = ref(null);

// Emit change when selected
const selectItem = (item) => {
  selected.value = item.name;
  isOpen.value = !isOpen.value;
  emit('updateModelValue', item.id);
};

// Close when clicked outside
const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="relative w-full text-left">
    <!-- Dropdown button -->
    <button
      type="button"
      class="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 bg-white rounded-md shadow-sm focus:outline-none"
      @click="isOpen = !isOpen"
    >
      <span :class="[
        selected ? 'text-xs text-textGray': 'text-xs text-textGray text-opacity-40'
      ]">{{ selected || placeholder }}</span>
      <!-- Arrow Icon -->
      <Icon name="formkit:down"  
      :class="['w-4 h-4 ml-2 transition-transform duration-500 ease-in-out text-textGray', { 'rotate-180': isOpen }]" />
    </button>

    <!-- Dropdown list -->
    <transition name="fade">
      <ul
        v-if="isOpen"
        class="absolute z-10 w-full mt-1 overflow-y-auto text-sm bg-white border border-gray-200 rounded-md shadow-lg max-h-32"
      >
        <li
          v-for="(item, index) in list"
          :key="index"
          @click="selectItem(item)"
          class="w-full px-4 py-2 text-gray-700 transition-colors duration-500 ease-in-out cursor-pointer hover:bg-opacity-10 hover:bg-textGray"
        >
          <!-- {{ item?.name }} -->
           {{ item?.name?.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") }}
        </li>
      </ul>
    </transition>
  </div>
</template>


<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
