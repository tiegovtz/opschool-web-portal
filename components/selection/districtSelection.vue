<script setup>
import axios from 'axios';

// Props
const props = defineProps({
    region: String,
    district: String,
    error: String,
});

// Reactive state
const data = reactive({
    district: [],
    status: "idle",
    error: null,
});

// Emit
defineEmits(["updateDistrict"]);

// Fetch district function
const fetchDistricts = async (region) => {
    data.status = "pending";
    data.error = null;

    try {
        const response = await axios.get(`https://apitie.ekima.africa/v1/schools/districts/${String(region).toUpperCase()}`);

        data.status = "success";
        data.district = response.data;
    } catch (err) {
        data.status = "error";
        data.error = err.message;
    }
};

// Watch for changes in region or district
watch(() => props.region, (region) => {
    if (region) {
        fetchDistricts(region);
    }
});

// Initial fetch
fetchDistricts(props.region);
</script>

<template>
    <div class="flex w-full flex-col items-start">
        <label for="school" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select District:</label>

        <select name="school" id="school" class="w-full p-2 focus:outline-none focus:ring-0 capitalize"
            :class="{ 'text-textGray/40': error }" @change="$emit('updateSchool', $event.target.value)">
            <option value="" v-if="data.status === 'idle'">Select Region First</option>
            <option value="" v-if="data.status === 'pending'">Loading...</option>
            <option value="" v-if="data.status === 'error'">{{ data.error }}</option>
            <option value="" v-else-if="data.district && data.status === 'success'">Eg (Arusha CC) ...</option>
            <option v-for="(district, index) in data.district" :key="index" :value="district">
                {{ `${district}`.charAt(0).toUpperCase() + `${district}`.slice(1).toLowerCase() }}
            </option>

        </select>

        <!-- Error message -->
        <small v-if="error" class="text-red-500 text-smallest w-full">
            {{ error }}
        </small>
    </div>
</template>
