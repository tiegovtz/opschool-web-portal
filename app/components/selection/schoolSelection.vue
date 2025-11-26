<script setup>
import { CustomDropDownList } from "#components";
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
const emit = defineEmits(["updateSchool"]);

// Fetch schools function
const fetchSchools = async (region, district) => {
    data.status = "pending";
    data.error = null;
    if (!region || !district || region === "" || district === "") {
        data.status = "idle";
        return;
    }

    try {
        const response = await axios.post("https://opschool.tie.go.tz:5001/v1/schools", {
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
  <div class="flex flex-col items-start w-full">
    <label for="school" class="font-semibold capitalize text-oceanBlue text-extraSmall">
      Select School:
    </label>
    
      <CustomDropDownList
        v-if="data.status === 'success' && data.schools.length"
        :list="data.schools.map(school => ({ id: school._id, name: school.name }))"
        :placeholder="'Choose a school'"
        @updateModelValue="emit('updateSchool',$event)"
      />

      <div v-else-if="data.status === 'idle'" class="mt-2 text-textGray/40">
        Select Region and District First
      </div>

      <div v-else-if="data.status === 'pending'" class="mt-2 text-textGray/40">
        Loading...
      </div>

      <div v-else-if="data.status === 'error'" class="mt-2 text-red-500">
        {{ data.error }}
      </div>

    <!-- Error message -->
    <small v-if="error" class="w-full mt-1 text-red-500 text-smallest">
      {{ error }}
    </small>
  </div>
</template>