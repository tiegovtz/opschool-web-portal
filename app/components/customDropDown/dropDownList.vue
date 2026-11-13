<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ inheritAttrs: false });
const contentLayoutLanguage = useContentLayoutLanguage();

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
    default: ''
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  focusableWhenDisabled: { type: Boolean, default: false },
  optionClass: { type: String, default: '' },
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
const instanceId = `ddl_${useId()}`;
const resolvedPlaceholder = computed(() =>
  props.placeholder ||
  (contentLayoutLanguage.value === 'kiswahili' ? 'Chagua chaguo' : 'Select an option')
);
const resolvedSearchPlaceholder = computed(() =>
  props.searchPlaceholder ||
  (contentLayoutLanguage.value === 'kiswahili' ? 'Andika ili kutafuta...' : 'Type to search...')
);

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

function closeAndFocus() {
  isOpen.value = false;
  nextTick(() => dropdownRef.value?.querySelector('[role="combobox"]')?.focus());
}
async function onDropdownKey(event) {
  if (props.disabled) return;
  if (event.key === 'Escape' && isOpen.value) { event.preventDefault(); event.stopPropagation(); closeAndFocus(); return; }
  if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
  if (event.target?.tagName === 'INPUT' && ['Home','End'].includes(event.key)) return;
  event.preventDefault();
  if (!isOpen.value) { isOpen.value = true; await nextTick(); }
  const options = Array.from(dropdownRef.value?.querySelectorAll('[role="option"]') || []);
  if (!options.length) return;
  const current = options.indexOf(document.activeElement);
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? (current + 1) % options.length : current <= 0 ? options.length - 1 : current - 1;
  options[index]?.focus();
}
function onDropdownFocusOut(event) {
  if (!dropdownRef.value?.contains(event.relatedTarget)) isOpen.value = false;
}

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

  closeAndFocus();
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
  <div ref="dropdownRef" class="relative w-full text-left" :class="$attrs.class" @keydown="onDropdownKey" @focusout="onDropdownFocusOut">
    <!-- Dropdown button -->
    <button :id="$attrs.id || `${instanceId}-button`" type="button" :class="[
       'flex items-center justify-between w-full h-full px-4 py-2 text-gray-700 rounded-md shadow-sm focus:outline-none',
      buttonClass
    ]" @click.stop="toggleOpen" role="combobox" aria-haspopup="listbox"
      :aria-expanded="(!disabled && isOpen) ? 'true' : 'false'"
      :aria-controls="$attrs.id ? `${$attrs.id}-listbox` : `${instanceId}-listbox`" :disabled="disabled && !focusableWhenDisabled"
      :aria-disabled="disabled ? 'true' : 'false'" v-bind="$attrs">
      <span :class="[
        selected ? 'text-md text-textGray' : 'text-md text-slate-600',
        'truncate whitespace-nowrap'
      ]">{{ selected || resolvedPlaceholder }}</span>
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
        :id="$attrs.id ? `${$attrs.id}-listbox` : `${instanceId}-listbox`" role="listbox">
        <li v-if="searchable" class="sticky top-0 z-10 p-2 bg-white border-b border-gray-100">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-oceanBlue"
            :placeholder="resolvedSearchPlaceholder"
            aria-label="Search options"
            @keydown.esc.prevent.stop="closeAndFocus"
          />
        </li>

        <li v-if="!filteredList.length" class="w-full px-4 py-2 text-gray-400">
          No results
        </li>

        <li v-for="(item, index) in filteredList" :key="index" role="option"
          :aria-selected="selectedLabel === item.name ? 'true' : 'false'" tabindex="-1" @click="selectItem(item)"
          @keydown.enter.prevent.stop="selectItem(item)" @keydown.space.prevent.stop="selectItem(item)"
          :class="optionClass" class="w-full min-h-11 px-4 py-2 text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-deepBlue transition-colors duration-500 ease-in-out cursor-pointer hover:bg-opacity-10 hover:bg-textGray">
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
