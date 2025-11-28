<script setup>
import { reactive, onMounted } from 'vue';
import { CustomDropDownList } from '#components';
import axios from 'axios';

// Props
const props = defineProps({
    error: String,       // validation error from parent
    region: String,      // current selected region value
});

// Reactive state
const data = reactive({
    regions: [],
    status: 'pending',   // 'pending' | 'success' | 'error'
    error: null,         // fetch error
});

// Emit
const emit = defineEmits(['updateRegion']);

// Fetch Region function
const fetchRegion = async () => {
    data.error = null;
    data.status = 'pending';

    try {
        const response = await axios.get(
            'https://opschool.tie.go.tz:5001/v1/schools/regions'
        );

        data.status = 'success';
        data.regions = response.data || [];
    } catch (err) {
        data.status = 'error';
        data.error = err?.message || 'Failed to fetch regions';
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
            Select region:
        </label>

        <!-- Dropdown when data loaded -->
        <CustomDropDownList v-if="data.status === 'success' && data.regions.length" id="region-select"
            :list="data.regions.map((regionName) => ({ id: regionName, name: regionName }))"
            placeholder="Eg ( Arusha ) ..." :model-value="region" :aria-invalid="!!error"
            aria-describedby="region-error" @update:modelValue="emit('updateRegion', $event)" />

        <!-- Loading state (announced to screen readers) -->
        <p v-else-if="data.status === 'pending'" role="status" aria-live="polite"
            class="mt-1 text-extraSmall text-textGray">
            Loading regions…
        </p>

        <!-- Fetch error state -->
        <p v-else-if="data.status === 'error'" class="mt-1 text-normalRed text-smallest" role="alert">
            Failed to fetch regions. Please try again.
        </p>

        <!-- Validation error from parent (e.g. "Region is required") -->
        <small v-if="error" id="region-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
            {{ error }}
        </small>
    </div>
</template>
