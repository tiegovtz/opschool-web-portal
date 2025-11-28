<script setup>
import { CustomDropDownList } from "#components";
import axios from 'axios';

// Props
const props = defineProps({
    error: String,
    region: String,
});

// Reactive state
const data = reactive({
    regions: [],
    status: "pending",
    error: null,
});

// Emit
const emit = defineEmits(["updateRegion"]);

// Fetch Region function
const fetchRegion = async () => {

    data.error = null;

    try {
        const response = await axios.get(`https://opschool.tie.go.tz:5001/v1/schools/regions`);

        data.status = "success";
        data.regions = response.data;
    } catch (err) {
        data.status = "error";
        data.error = err.message;
    }
};

// Initial Fetch
fetchRegion();
</script>

<template>
    <div class="flex flex-col items-start w-full">
        <label for="region" class="font-semibold capitalize text-oceanBlue text-extraSmall">Select Region:</label>

        <CustomDropDownList v-if="data.status === 'success' && data.regions.length"
            :list="data.regions.map(region => ({ id: region, name: region }))"
            :placeholder="data.status === 'pending' ? 'Loading...' : (data.status === 'error' ? error : 'Eg ( Arusha ) ...')"
            :model-value="region" @updateModelValue="emit('updateRegion', $event)" />

        <p v-else-if="data.status === 'pending'">Loading...</p>
        <p v-else-if="data.status === 'error'" class="text-normalRed text-smallest">Failed to Fetch data</p>

        <!-- Error message -->
        <small v-if="error" class="w-full text-red-500 text-smallest">
            {{ error }}
        </small>
    </div>
</template>