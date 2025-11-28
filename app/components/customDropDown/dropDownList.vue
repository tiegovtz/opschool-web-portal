<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAttrs } from 'vue';

const props = defineProps({
  list: {
    type: Array,
    required: true, // [{ id, name }, ...]
  },
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
});

const emit = defineEmits(['update:modelValue']); // v-model support
const attrs = useAttrs(); // to forward id, aria-* from parent

const isOpen = ref(false);
const selectedLabel = ref('');
const dropdownRef = ref(null);

// derive initial label from modelValue (if needed)
onMounted(() => {
  if (props.modelValue) {
    const match = props.list.find(
      (item) => item.id === props.modelValue || item.name === props.modelValue
    );
    if (match) selectedLabel.value = match.name;
  }
});

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

// Emit change when selected
const selectItem = (item) => {
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
      class="flex items-center justify-between w-full h-full px-4 py-2 text-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue"
      @click.stop="toggleOpen" role="combobox" aria-haspopup="listbox" :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="attrs.id ? `${attrs.id}-listbox` : 'dropdown-listbox'" v-bind="attrs" :aria-label="placeholder">
      <span :class="[
        selectedLabel ? 'text-md text-textGray' : 'text-md text-textGray text-opacity-40',
      ]">
        {{ selectedLabel || placeholder }}
      </span>

      <!-- Arrow Icon (decorative) -->
      <Icon name="formkit:down" :class="[
        'w-4 h-4 ml-2 transition-transform duration-500 ease-in-out text-textGray',
        { 'rotate-180': isOpen },
      ]" aria-hidden="true" />
    </button>

    <!-- Dropdown list -->
    <transition name="fade">
      <ul v-if="isOpen"
        class="absolute z-10 w-full mt-1 overflow-y-auto text-sm bg-white border border-gray-200 rounded-md shadow-lg scrollbar-none max-h-32"
        :id="attrs.id ? `${attrs.id}-listbox` : 'dropdown-listbox'" role="listbox">
        <li v-for="(item, index) in list" :key="index" role="option"
          :aria-selected="selectedLabel === item.name ? 'true' : 'false'" tabindex="0" @click.stop="selectItem(item)"
          @keydown.enter.prevent.stop="selectItem(item)" @keydown.space.prevent.stop="selectItem(item)"
          class="w-full px-4 py-2 text-gray-700 transition-colors duration-500 ease-in-out cursor-pointer hover:bg-opacity-10 hover:bg-textGray focus:outline-none focus:bg-opacity-10 focus:bg-textGray">
          {{
            item?.name
              ?.split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
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
