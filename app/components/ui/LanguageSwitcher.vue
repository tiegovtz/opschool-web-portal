<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { LanguageSupport } from '~/types/language.interface';

type LanguageOption = {
    label: string;
    value: LanguageSupport;
};

const props = withDefaults(defineProps<{
    modelValue?: LanguageSupport,
    label?: string,
    options?: LanguageOption[],
    active?: LanguageSupport,
    languageSwitchContent?: Record<LanguageSupport, string>,
    switcher?: (language: LanguageSupport) => void
}>(), 
{
    modelValue: undefined,
    label: 'Language',
    options: undefined,
    active: 'english',
    languageSwitchContent: () => ({
        english: 'English',
        kiswahili: 'Kiswahili',
    }),
    switcher: () => {}
})

const emit = defineEmits<{
    'update:modelValue': [value: LanguageSupport],
    change: [value: LanguageSupport]
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const fallbackOptions = computed<LanguageOption[]>(() => [
    {
        label: props.languageSwitchContent.english,
        value: 'english',
    },
    {
        label: props.languageSwitchContent.kiswahili,
        value: 'kiswahili',
    },
]);

const resolvedOptions = computed(() =>
    props.options?.length ? props.options : fallbackOptions.value
);

const selectedValue = computed(() =>
    props.modelValue ?? props.active
);

const selectedOption = computed(() =>
    resolvedOptions.value.find((option) => option.value === selectedValue.value)
);

const activeLanguageLabel = computed(() =>
    selectedOption.value?.label ?? props.label
);

function toggleDropdown() {
    isOpen.value = !isOpen.value;
}

function closeDropdown() {
    isOpen.value = false;
}

function selectLanguage(language: LanguageSupport) {
    emit('update:modelValue', language);
    emit('change', language);
    props.switcher(language);
    closeDropdown();
}

function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node | null;
    if (target && dropdownRef.value?.contains(target)) return;
    closeDropdown();
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>
<template>
    <div ref="dropdownRef" class="relative inline-block min-w-36 text-left">
        <button
            type="button"
            class="relative flex w-full items-center justify-center gap-2 rounded-md bg-transparent px-9 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-deepBlue/40"
            aria-haspopup="listbox"
            :aria-expanded="isOpen ? 'true' : 'false'"
            @click.stop="toggleDropdown"
            @keydown.esc.prevent.stop="closeDropdown"
        >
            <Icon
                name="lucide:globe"
                class="absolute left-3 h-4 w-4 text-slate-600"
                aria-hidden="true"
            />
            <span class="max-w-28 truncate text-center">
                {{ activeLanguageLabel }}
            </span>
            <Icon
                name="lucide:chevron-down"
                :class="[
                    'absolute right-3 h-4 w-4 text-slate-600 transition-transform duration-200',
                    { 'rotate-180': isOpen }
                ]"
                aria-hidden="true"
            />
        </button>

        <Transition name="language-dropdown">
            <ul
                v-if="isOpen"
                class="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-md bg-white py-1 text-sm shadow-lg"
                role="listbox"
            >
                <li
                    v-for="option in resolvedOptions"
                    :key="option.value"
                    role="option"
                    :aria-selected="selectedValue === option.value ? 'true' : 'false'"
                >
                    <button
                        type="button"
                        class="flex w-full items-center justify-center px-4 py-2 text-center text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                        :class="{ 'font-semibold text-deepBlue': selectedValue === option.value }"
                        @click="selectLanguage(option.value)"
                    >
                        {{ option.label }}
                    </button>
                </li>
            </ul>
        </Transition>
    </div>
</template>

<style scoped>
.language-dropdown-enter-active,
.language-dropdown-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.language-dropdown-enter-from,
.language-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
