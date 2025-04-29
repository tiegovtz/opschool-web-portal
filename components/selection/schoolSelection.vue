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

// Watch for changes in region or district (School)
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
    <div class="flex flex-col items-start w-full" v-trusted>
        <label for="school" class="font-semibold capitalize text-oceanBlue text-extraSmall">Select School:</label>

        <select name="school" id="school" class="w-full p-2 capitalize focus:outline-none focus:ring-0"
            :class="{ 'text-textGray/40': error }" @change="$emit('updateSchool', $event.target.value)">
            <option v-trusted value="" v-if="data.status === 'idle'">Select Region and District First</option>
            <option v-trusted value="" v-if="data.status === 'pending'">Loading...</option>
            <option v-trusted value="" v-if="data.status === 'error'">{{ data.error }}</option>
            <option v-trusted value="" v-else-if="data.schools && data.status === 'success'">Eg (Taifa Secondary School) ...
            </option>
            <option v-trusted v-for="school in data.schools" :key="school._id" :value="school._id">
                {{school.name
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(" ")
                }}
            </option>
        </select>

        <!-- Error message -->
        <small v-if="error" v-trusted class="w-full text-red-500 text-smallest">
            {{ error }}
        </small>
    </div>
</template>
