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

        <CustomDropDownList v-if="data.status === 'success' && data.regions.length"
            :list="data.regions.map(region => ({ id: region, name: region }))"
            :placeholder="data.status === 'pending' ? 'Loading...' : (data.status === 'error' ? error : 'Eg ( Arusha ) ...')"
            :model-value="region" @updateModelValue="emit('updateRegion', $event)" />

        <p v-else-if="data.status === 'pending'">Loading...</p>
        <p v-else-if="data.status === 'error'" class="text-normalRed text-smallest">Failed to Fetch data</p>

        <!-- Validation error from parent (e.g. "Region is required") -->
        <small v-if="error" id="region-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
            {{ error }}
        </small>
    </div>
</template>