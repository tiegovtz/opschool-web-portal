<script setup>
import axios from 'axios';

// Props
const props = defineProps({
    error: String,
    region: String,
});

// Reactive state
const data = reactive({
    regions: [],
    status: "idle",
    error: null,
});

// Emit
defineEmits(["updateRegion"]);

// Fetch district function
const fetchDistricts = async (region) => {
    data.status = "pending";
    data.error = null;

    try {
        const response = await axios.get(`https://apitie.ekima.africa/v1/schools/regions`);

        data.status = "success";
        data.district = response.data;
    } catch (err) {
        data.status = "error";
        data.error = err.message;
    }
};

// Initial fetch
fetchDistricts();
</script>

<template>
    <div class="flex w-full flex-col items-start">
        <label for="region" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select Region:</label>

        <select name="region" id="region" class="w-full p-2 focus:outline-none focus:ring-0 capitalize"
            :class="{ 'text-textGray/40': region }" @change="$emit('updateRegion', $event.target.value)">
            <option value="" v-if="data.status === 'pending'">Loading...</option>
            <option value="" v-else-if="data.status === 'error'">{{ data.error }}</option>
            <option value="" v-else-if="data.regions && data.status === 'success'">Eg ( Arusha ) ...</option>
            <option v-for="(region, index) in data.regions" :key="index" :value="region">
                {{ `${region}`.charAt(0).toUpperCase() + `${region}`.slice(1).toLowerCase() }}
            </option>

        </select>

        <!-- Error message -->
        <small v-if="error" class="text-red-500 text-smallest w-full">
            {{ error }}
        </small>
    </div>
</template>
