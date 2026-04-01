<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

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
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Type to search...'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  buttonClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['updateModelValue', 'update:modelValue']);

const isOpen = ref(false);
const selected = ref('');
const dropdownRef = ref(null);
const selectedLabel = ref('');
const searchQuery = ref('');
const searchInputRef = ref(null);
const openUp = ref(false);
const instanceId = `ddl_${Math.random().toString(36).slice(2)}_${Date.now()}`;

/** Match API rows (`_id`) and option shapes (`id`) plus plain `name` (case-insensitive). */
function findListItem(list, rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '') return undefined;
  const sv = String(rawVal).trim().toLowerCase();
  return list.find((i) => {
    const key = i.id ?? i._id;
    if (key !== undefined && key !== null && String(key).trim().toLowerCase() === sv) {
      return true;
    }
    if (i.name != null && String(i.name).trim().toLowerCase() === sv) {
      return true;
    }
    return false;
  });
}

function itemOptionValue(item) {
  return item.id ?? item._id ?? item.name;
}

// Watch for modelValue changes to update selected display text
watch(() => props.modelValue, (newVal) => {
  if (newVal !== null && newVal !== undefined && newVal !== '') {
    const item = findListItem(props.list, newVal);
    selected.value = item ? item.name : '';
  } else {
    selected.value = '';
  }
}, { immediate: true });

watch(() => props.list, (newVal) => {
  if (newVal !== null && newVal !== undefined) {
    const item = findListItem(newVal, props.modelValue);
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

function updateOpenDirection() {
  const el = dropdownRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;
  openUp.value = spaceBelow < 260 && spaceAbove > spaceBelow;
}

function handleDropdownOpenEvent(e) {
  const id = e?.detail?.id;
  if (!id) return;
  if (id !== instanceId) {
    isOpen.value = false;
  }
}

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!props.searchable || !q) return props.list;
  return (props.list ?? []).filter((item) => {
    const name = (item?.name ?? '').toString().toLowerCase();
    return name.includes(q);
  });
});

watch(isOpen, async (open) => {
  if (open) {
    // close any other open dropdowns
    window.dispatchEvent(new CustomEvent("dropdown-opened", { detail: { id: instanceId } }));
    updateOpenDirection();
    searchQuery.value = '';
    await nextTick();
    if (props.searchable) {
      searchInputRef.value?.focus?.();
    }
  }
});

const selectItem = (item) => {
  if (props.disabled) return;

  selectedLabel.value = item.name;
  selected.value = item.name;

  const out = itemOptionValue(item);
  emit('updateModelValue', out);
  emit('update:modelValue', out);

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
  window.addEventListener("dropdown-opened", handleDropdownOpenEvent);
  window.addEventListener("resize", updateOpenDirection);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener("dropdown-opened", handleDropdownOpenEvent);
  window.removeEventListener("resize", updateOpenDirection);
});
</script>

<template>
  <div ref="dropdownRef" class="relative w-full text-left">
    <!-- Dropdown button -->
    <button type="button" :class="[
       'flex items-center justify-between w-full h-full px-4 py-2 text-gray-700 rounded-md shadow-sm focus:outline-none',
      buttonClass
    ]" @click.stop="toggleOpen" role="combobox" aria-haspopup="listbox"
      :aria-expanded="(!disabled && isOpen) ? 'true' : 'false'"
      :aria-controls="$attrs.id ? `${$attrs.id}-listbox` : 'dropdown-listbox'" :disabled="disabled"
      :aria-disabled="disabled ? 'true' : 'false'" v-bind="$attrs">
      <span :class="[
        selected ? 'text-md text-textGray' : 'text-md text-textGray text-opacity-40',
        'truncate whitespace-nowrap'
      ]">{{ selected || placeholder }}</span>
      <!-- Arrow Icon -->
      <Icon name="formkit:down"
        :class="['w-4 h-4 ml-2 transition-transform duration-500 ease-in-out text-textGray', { 'rotate-180': isOpen }]" />
    </button>

    <!-- Dropdown list -->
    <transition name="fade">
      <ul v-if="isOpen && !disabled"
        :class="[
          'absolute z-10 w-full overflow-y-auto text-sm bg-white border border-gray-200 rounded-md shadow-lg scrollbar-none max-h-48',
          openUp ? 'bottom-full mb-1' : 'top-full mt-1'
        ]"
        :id="$attrs.id ? `${$attrs.id}-listbox` : 'dropdown-listbox'" role="listbox">
        <li v-if="searchable" class="sticky top-0 z-10 p-2 bg-white border-b border-gray-100">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-oceanBlue"
            :placeholder="searchPlaceholder"
            aria-label="Search options"
            @keydown.esc.prevent.stop="isOpen = false"
          />
        </li>

        <li v-if="!filteredList.length" class="w-full px-4 py-2 text-gray-400">
          No results
        </li>

        <li v-for="(item, index) in filteredList" :key="index" role="option"
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
  transition: all 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
