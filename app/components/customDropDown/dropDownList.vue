<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

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
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updateModelValue']);

const isOpen = ref(false);
const selected = ref('');
const dropdownRef = ref(null);

// Watch for modelValue changes to update selected display text
watch(() => props.modelValue, (newVal) => {
  if (newVal !== null && newVal !== undefined) {
    const item = props.list.find(i => i.id === newVal);
    selected.value = item ? item.name : '';
  } else {
    selected.value = '';
  }
}, { immediate: true });

// Toggle dropdown open/close
const toggleOpen = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};
// Toggle dropdown open/close
const toggleOpen = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

const selectItem = (item) => {
  if (props.disabled) return;
  selectedLabel.value = item.name;
  emit('update:modelValue', item.id ?? item.name);
  isOpen.value = false;
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
    <button type="button"
      class="flex items-center justify-between w-full h-full px-4 py-2 text-gray-700 rounded-md shadow-sm focus:outline-none"
      @click.stop="toggleOpen" role="combobox" aria-haspopup="listbox"
      :aria-expanded="(!disabled && isOpen) ? 'true' : 'false'"
      :aria-controls="$attrs.id ? `${$attrs.id}-listbox` : 'dropdown-listbox'" :disabled="disabled"
      :aria-disabled="disabled ? 'true' : 'false'" v-bind="$attrs">
      <span :class="[
        selected ? 'text-md text-textGray' : 'text-md text-textGray text-opacity-40'
      ]">{{ selected || placeholder }}</span>
      <!-- Arrow Icon -->
      <Icon name="formkit:down"
        :class="['w-4 h-4 ml-2 transition-transform duration-500 ease-in-out text-textGray', { 'rotate-180': isOpen }]" />
    </button>

    <!-- Dropdown list -->
    <transition name="fade">
      <ul v-if="isOpen && !disabled"
        class="absolute z-10 w-full mt-1 overflow-y-auto text-sm bg-white border border-gray-200 rounded-md shadow-lg scrollbar-none max-h-32"
        :id="$attrs.id ? `${$attrs.id}-listbox` : 'dropdown-listbox'" role="listbox">
        <li v-for="(item, index) in list" :key="index" role="option"
          :aria-selected="selectedLabel === item.name ? 'true' : 'false'" tabindex="0" @click="selectItem(item)"
          @keydown.enter.prevent.stop="selectItem(item)" @keydown.space.prevent.stop="selectItem(item)"
          class="w-full px-4 py-2 text-gray-700 transition-colors duration-500 ease-in-out cursor-pointer hover:bg-opacity-10 hover:bg-textGray">
          <!-- {{ item?.name }} -->
          {{item?.name?.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")
          }}
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