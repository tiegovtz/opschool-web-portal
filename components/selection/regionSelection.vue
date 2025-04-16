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
    status: "pending",
    error: null,
});

// Emit
defineEmits(["updateRegion"]);

// Fetch Region function
const fetchRegion = async () => {
   
    data.error = null;

    try {
        const response = await axios.get(`https://apitie.ekima.africa/v1/schools/regions`);

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

        <select name="region" id="region" class="w-full p-2 capitalize focus:outline-none focus:ring-0"
            :class="{ 'text-textGray/40': region }" @change="$emit('updateRegion',$event.target.value)">
            <option value="" v-if="data.status === 'pending'">Loading...</option>
            <option value="" v-else-if="data.status === 'error'">{{ data.error }}</option>
            <option value="" v-else-if="data.regions && data.status === 'success'">Eg ( Arusha ) ...</option>
            <option v-for="(region, index) in data.regions" :key="index" :value="region">
                {{ `${region}`.charAt(0).toUpperCase() + `${region}`.slice(1).toLowerCase() }}
            </option>

        </select>

        <!-- Error message -->
        <small v-if="error" class="w-full text-red-500 text-smallest">
            {{ error }}
        </small>
    </div>
</template>
