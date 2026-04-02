<script setup lang="ts">
import { reactive, onMounted, computed, type PropType } from 'vue';
import { CustomDropDownList } from '#components';
import apiDocs from '~/utilities/apiDocs';
import type { LanguageSupport } from '~/types/language.interface';

// Props
const props = defineProps({
    error: String,       // validation error from parent
    region: String,      // current selected region value
    language: {
        type: String as PropType<LanguageSupport>,
        default: 'english',
    },
});

type statusType = "idle" | "pending" | "success" | "error";

// Reactive state
const data =  reactive<{ regions: any[], status: statusType, error: any }>({
    regions: [],
    status: "pending",
    error: null,         // fetch error 
});

// Emit
const emit = defineEmits(['updateRegion']);

const isSwahili = computed(() => props.language === 'kiswahili');
const content = computed(() => ({
    label: isSwahili.value ? 'Chagua mkoa:' : 'Select region:',
    placeholder: isSwahili.value ? 'Mfano: Arusha' : 'Eg ( Arusha ) ...',
    loading: isSwahili.value ? 'Inapakia mikoa…' : 'Loading regions…',
    error: isSwahili.value ? 'Imeshindikana kupakia mikoa. Tafadhali jaribu tena.' : 'Failed to fetch regions. Please try again.',
    unknown: isSwahili.value ? 'Kuna tatizo limetokea.' : 'Something went wrong',
}));

// Fetch Region function
const fetchRegion = async () => {
    data.error = null;
    data.status = 'pending';

    try {
        const response = await $fetch<any[]>(apiDocs.school.getSchoolRegions);

        data.status = 'success';
        data.regions = response || [];
    } catch (err) {
        data.status = 'error';
        data.error = err || 'Failed to fetch regions';
    }
};

// Fetch on mount
onMounted(async () => {
    await fetchRegion();
});
</script>

<template>
    <div class="flex flex-col items-start w-full" :aria-busy="data.status === 'pending' ? 'true' : 'false'">
        <label for="region-select" class="font-semibold capitalize text-oceanBlue text-extraSmall">
            {{ content.label }}
        </label>

        <!-- Dropdown when data loaded -->
        <CustomDropDownList v-if="data.status === 'success' && data.regions.length" id="region-select"
            :list="data.regions.map((regionName) => ({ id: regionName, name: regionName }))"
            :placeholder="content.placeholder" :model-value="region" :aria-invalid="!!error"
            aria-describedby="region-error" @update-model-value="emit('updateRegion', $event)" />

        <!-- Loading state (announced to screen readers) -->
        <p v-else-if="data.status === 'pending'" role="status" aria-live="polite"
            class="mt-1 text-extraSmall text-textGray">
            {{ content.loading }}
        </p>

        <!-- Fetch error state -->
        <p v-else-if="data.status === 'error'" class="mt-1 text-normalRed text-smallest" role="alert">
            {{ content.error }}
        </p>
        <p v-else>
            {{ content.unknown }}
        </p>

        <!-- Validation error from parent (e.g. "Region is required") -->
        <small v-if="error" id="region-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
            {{ error }}
        </small>
    </div>
</template>
