<script setup>
import { CustomDropDownList } from "#components";
import axios from "axios";
import { reactive, ref, watch } from "vue";

const props = defineProps({
  region: String,
  district: String,
  error: String,
  school: String,
});

const data = reactive({
  schools: [],
  status: "idle",
  error: null,
});

const emit = defineEmits(["updateSchool"]);

// local v-model for dropdown
const selectedSchool = ref(props.school ?? null);

// Emit to parent whenever dropdown changes
watch(selectedSchool, (val) => {
  emit("updateSchool", val);
});

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
    <!-- Label correctly linked to dropdown via id -->
    <label for="school" class="font-semibold capitalize text-oceanBlue text-extraSmall">
      Select school:
    </label>

    <CustomDropDownList v-if="data.status === 'success' && data.schools.length"
      :list="data.schools.map(school => ({ id: school._id, name: school.name }))" :placeholder="'Choose a school'"
      @updateModelValue="emit('updateSchool', $event)" />

    <div v-else-if="data.status === 'idle'" class="mt-2 text-textGray/40">
      Select Region and District First
    </div>

    <div v-else-if="data.status === 'pending'" class="mt-2 text-textGray/40">
      Loading...
    </div>

    <div v-else-if="data.status === 'error'" class="mt-2 text-red-500">
      {{ data.error }}
    </div>

    <!-- Validation error from parent -->
    <small v-if="error" id="school-error" class="w-full mt-1 text-red-500 text-smallest" role="alert">
      {{ error }}
    </small>
  </div>
</template>
