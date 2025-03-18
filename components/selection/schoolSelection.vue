<script setup>
import axios from 'axios';

// Props
const props = defineProps({
    region: String,
    district: String,
    error: String,
    school: String,
});

// Reactive state
const data = reactive({
    schools: [],
    status: "idle",
    error: null,
});

// Emit
defineEmits(["updateSchool"]);

// Fetch schools function
const fetchSchools = async (region, district) => {
    data.status = "pending";
    data.error = null;
    console.log(" Update District:", district, "Update Region:", region);
    if (!region || !district || region === "" || district === "") {
        data.status = "idle";
        return;
    }

    try {
        const response = await axios.post("https://apitie.ekima.africa/v1/schools", {
            region: `${region}`.toUpperCase(),
            district: `${district}`.toUpperCase(),
        });

        data.status = "success";
        data.schools = response.data;
    } catch (err) {
        data.status = "error";
        data.error = err.message;
    }
};

// Watch for changes in region or district
watch(() => props.district, (district) => {
    if (district) {
        fetchSchools(props.region, district);

    }
});

watch(() => props.region, (region) => {
    if (region) {
        fetchSchools(region, props.district);
    }
});
</script>

<template>
    <div class="flex w-full flex-col items-start">
        <label for="school" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select School:</label>

        <select name="school" id="school" class="w-full p-2 focus:outline-none focus:ring-0 capitalize"
            :class="{ 'text-textGray/40': error }" @change="$emit('updateSchool', $event.target.value)">
            <option value="" v-if="data.status === 'idle'">Select Region and District First</option>
            <option value="" v-if="data.status === 'pending'">Loading...</option>
            <option value="" v-if="data.status === 'error'">{{ data.error }}</option>
            <option value="" v-else-if="data.schools && data.status === 'success'">Eg (Taifa Secondary School) ...
            </option>
            <option v-for="school in data.schools" :key="school._id" :value="school._id">
                {{school.name
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(" ")
                }}
            </option>
        </select>

        <!-- Error message -->
        <small v-if="error" class="text-red-500 text-smallest w-full">
            {{ error }}
        </small>
    </div>
</template>
